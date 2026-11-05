import './styles.css';
import { CITY_SEED } from './config';
import { $ } from './core/dom';
import { newGame } from './game/state';
import type { Game, Hooks } from './game/types';
import { update } from './game/update';
import { Input } from './input/input';
import { attachKeyboard } from './input/keyboard';
import { attachPointer } from './input/pointer';
import { attachTouch } from './input/touch';
import { measureView, render } from './render/renderer';
import { Hud } from './ui/hud';
import { Radio } from './ui/radio';
import { hideScreens, setPaused, showEnd } from './ui/screens';
import { makeLevel } from './world/level';

type State = 'menu' | 'play' | 'pause' | 'end';

const canvas = $<HTMLCanvasElement>('cv');
const ctx = canvas.getContext('2d')!;
const mctx = $<HTMLCanvasElement>('mm').getContext('2d')!;
const hud = new Hud();
const radio = new Radio($('radio'));
const input = new Input();

const level = makeLevel(CITY_SEED);
let state: State = 'menu';
let view = measureView(canvas);

const hooks: Hooks = {
  radio: (who, text, cls) => radio.push(who, text, cls),
  objective: (text) => hud.objective(text),
  end: (reason) => {
    state = 'end';
    showEnd(game, reason);
  },
};

function freshGame(): Game {
  radio.clear();
  return newGame(level, hooks);
}

// Attract mode: the menu shows a live (paused) city behind it.
let game = freshGame();

function start() {
  game = freshGame();
  state = 'play';
  hideScreens();
  canvas.focus?.();
}

function togglePause() {
  if (state === 'play') { state = 'pause'; setPaused(true); }
  else if (state === 'pause') { state = 'play'; setPaused(false); last = performance.now(); }
}

attachKeyboard(input, togglePause);
attachPointer(input, canvas);
attachTouch(input, canvas, $('knob'), $('fire'));
addEventListener('blur', () => { if (state === 'play') togglePause(); });
addEventListener('resize', () => { view = measureView(canvas); });
$('startBtn').onclick = start;
$('againBtn').onclick = start;
$('resumeBtn').onclick = togglePause;

let last = performance.now();
let lastHud = 0;
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === 'play') update(game, input, dt);
  render(ctx, mctx, game, view);
  if (now - lastHud > 100) {
    hud.update(game);
    radio.tick(now);
    lastHud = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
