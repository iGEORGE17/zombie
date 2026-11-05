import '@fontsource/saira-stencil-one/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './styles.css';
import { CITY_SEED, DIFFICULTY } from './config';
import { $ } from './core/dom';
import { newGame } from './game/state';
import type { Game, Hooks } from './game/types';
import { update } from './game/update';
import { Input } from './input/input';
import { attachKeyboard } from './input/keyboard';
import { attachPointer } from './input/pointer';
import { attachTouch } from './input/touch';
import { platform } from './platform/crazygames';
import { measureView, render } from './render/renderer';
import { loadAimMode, loadDifficulty, saveAimMode, saveDifficulty } from './save/prefs';
import { Hud } from './ui/hud';
import { Radio } from './ui/radio';
import { hideScreens, mountDifficultyPicker, setPaused, showEnd } from './ui/screens';
import { type Level, makeLevel } from './world/level';

type State = 'menu' | 'play' | 'pause' | 'end';

const canvas = $<HTMLCanvasElement>('cv');
const ctx = canvas.getContext('2d')!;
const mctx = $<HTMLCanvasElement>('mm').getContext('2d')!;
const startBtn = $<HTMLButtonElement>('startBtn');
const againBtn = $<HTMLButtonElement>('againBtn');
const hud = new Hud();
const radio = new Radio($('radio'));
const input = new Input();
input.aimMode = loadAimMode();

let state: State = 'menu';
let difficulty = loadDifficulty();
let view = measureView(canvas);
let level: Level;
let game: Game;

const hooks: Hooks = {
  radio: (who, text, cls) => radio.push(who, text, cls),
  objective: (text) => hud.objective(text),
  end: (reason) => {
    state = 'end';
    input.reset();
    platform.gameplayStop();
    if (reason === 'win') platform.happytime();
    showEnd(game, reason);
  },
};

function freshGame(): Game {
  radio.clear();
  return newGame(level, hooks, { diff: DIFFICULTY[difficulty] });
}

function start() {
  game = freshGame();
  state = 'play';
  hideScreens();
  canvas.focus?.();
  last = performance.now();
  platform.gameplayStart();
}

/** `byBlur`: the platform already tracks focus, so focus-loss pauses are not reported to the SDK. */
function pause(byBlur = false) {
  if (state !== 'play') return;
  state = 'pause';
  setPaused(true);
  input.reset();
  if (!byBlur) platform.gameplayStop();
}

function resume() {
  if (state !== 'pause') return;
  state = 'play';
  setPaused(false);
  last = performance.now();
  platform.gameplayStart();
}

/** Retry goes through a midgame ad (a natural break). Without ads it continues immediately. */
async function retry() {
  againBtn.disabled = true;
  await platform.midgameAd();
  againBtn.disabled = false;
  start();
}

let last = performance.now();
let lastHud = 0;
/** Dev autopilot recording steps frames by hand instead of on rAF. */
let manualClock = false;
function frame(now: number) {
  if (manualClock) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === 'play') update(game, input, dt);
  render(ctx, mctx, game, view);
  if (now - lastHud > 100) {
    hud.update(game, input);
    radio.tick(now);
    lastHud = now;
  }
  requestAnimationFrame(frame);
}

function boot() {
  // SDK resolves in the background; the game never blocks on it (it can be slow or blocked).
  void platform.init();
  level = makeLevel(CITY_SEED);
  game = freshGame(); // attract mode: a live, paused city behind the menu

  mountDifficultyPicker(difficulty, (id) => { difficulty = id; saveDifficulty(id); });
  attachKeyboard(
    input,
    () => (state === 'play' ? pause() : resume()),
    () => {
      input.aimMode = input.aimMode === 'auto' ? 'manual' : 'auto';
      saveAimMode(input.aimMode);
      radio.push('Aim', input.aimMode === 'auto' ? 'Auto-aim on. Point at an enemy to pick it.' : 'Manual aim. Aim with the mouse.');
    },
  );
  attachPointer(input, canvas);
  attachTouch(input, canvas, $('knob'), $('fire'));
  addEventListener('blur', () => pause(true));
  addEventListener('resize', () => { view = measureView(canvas); });
  startBtn.onclick = start;
  againBtn.onclick = retry;
  $('resumeBtn').onclick = resume;
  startBtn.disabled = false;
  requestAnimationFrame(frame);
}

boot();

// Dev-only hooks for automated playtests and store-video capture; stripped from production builds.
if (import.meta.env.DEV) {
  Object.assign(window, { __debug: { get game() { return game; }, get state() { return state; } } });
  if (new URLSearchParams(location.search).has('autopilot')) {
    import('./dev/autopilot').then(({ makeAutopilot }) => {
      const pilot = makeAutopilot();
      let clock = 0;
      Object.assign(window, {
        __autopilot: {
          /** Start a run already `warp` seconds in, so the horde is up to speed. */
          start(warp = 0) {
            manualClock = true;
            start();
            game.t = warp;
          },
          step(dt: number) {
            clock += dt * 1000;
            pilot(game, input, dt);
            if (state === 'play') update(game, input, dt);
            render(ctx, mctx, game, view);
            hud.update(game, input);
            radio.tick(performance.now());
            return clock;
          },
        },
      });
    });
  }
}
