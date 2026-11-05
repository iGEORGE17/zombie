/**
 * Store cover art rendered with the real game renderer: a staged firefight on a city crossroads.
 * Open /tools/covers.html?z=1.6 in the dev server at the target size (see capture-media.mjs).
 * Only the game title may appear as text (CrazyGames cover rules).
 */
import '@fontsource/saira-stencil-one/latin-400.css';
import { CITY_SEED, DIFFICULTY, T } from '../src/config';
import { mulberry32 } from '../src/core/rng';
import { mkEnemy } from '../src/game/enemies';
import { newGame } from '../src/game/state';
import type { Enemy } from '../src/game/types';
import { render } from '../src/render/renderer';
import { makeLevel } from '../src/world/level';

const q = new URLSearchParams(location.search);
const w = innerWidth, h = innerHeight, dpr = devicePixelRatio || 1;
const z = Number(q.get('z') ?? 1.6);
document.body.className = w / h > 1.2 ? 'land' : w / h < 0.85 ? 'tall' : 'square';

const canvas = document.getElementById('cv') as HTMLCanvasElement;
canvas.width = w * dpr; canvas.height = h * dpr;
const mini = document.createElement('canvas').getContext('2d')!;

const rng = mulberry32(7);
const g = newGame(makeLevel(CITY_SEED), { radio() {}, objective() {}, end() {} }, { diff: DIFFICULTY.standard, rng });

// Player on the crossroads at tile (37, 28), firing at a horde coming down the road.
const P = { x: 37 * T, y: 28 * T };
const landscape = document.body.className === 'land';
g.p.x = P.x;
g.p.y = P.y + (landscape ? 0 : 2.2 * T);
// Landscape: the title owns the left side, so aim the camera left of the player.
const focus = landscape ? { x: g.p.x - (w / z) * 0.2, y: g.p.y } : undefined;
g.p.inf = 30;
g.zone = null;
g.t = 1.2;

const at = (kind: Enemy['kind'], dx: number, dy: number, ang?: number) => {
  const e = mkEnemy(rng, DIFFICULTY.standard, kind, g.p.x + dx * T, g.p.y + dy * T);
  e.ang = ang ?? Math.atan2(-dy, -dx);
  e.wob = rng() * 6;
  return e;
};
g.enemies = [
  at('walker', 4.2, -1.2), at('walker', 5.4, 0.6), at('runner', 3.1, 0.2), at('brute', 6.8, -0.4),
  at('walker', 7.6, 1.4), at('walker', 2.4, -3.6), at('runner', -2.8, -3.1), at('walker', -4.4, 1.8),
  at('walker', 1.2, 4.3), at('scav', -6.2, -2.4),
];
const hit = g.enemies[2];
g.p.ang = Math.atan2(hit.y - g.p.y, hit.x - g.p.x);

// Rounds in flight, a muzzle flash, hit sparks and some blood on the asphalt.
for (const k of [0.55, 0.78]) {
  g.bullets.push({ x: g.p.x + (hit.x - g.p.x) * k, y: g.p.y + (hit.y - g.p.y) * k, vx: Math.cos(g.p.ang) * 760, vy: Math.sin(g.p.ang) * 760, life: 1, dmg: 0, from: 'player' });
}
const scav = g.enemies[g.enemies.length - 1];
const sa = Math.atan2(g.p.y - scav.y, g.p.x - scav.x);
g.bullets.push({ x: scav.x + Math.cos(sa) * 70, y: scav.y + Math.sin(sa) * 70, vx: Math.cos(sa) * 400, vy: Math.sin(sa) * 400, life: 1, dmg: 0, from: 'enemy' });
for (let i = 0; i < 9; i++) {
  const a = rng() * 6.28, d = 4 + rng() * 9;
  g.fx.push({ x: hit.x + Math.cos(a) * d, y: hit.y + Math.sin(a) * d, vx: 0, vy: 0, life: 0.3, max: 0.5, c: '#6f8a3c', s: 1.5 + rng() * 1.5 });
}
g.decals = [];
g.items = [
  { type: 'page', x: g.p.x - 2.6 * T, y: g.p.y + 2.4 * T },
  { type: 'vial', x: g.p.x + 1.6 * T, y: g.p.y + 2.8 * T },
  { type: 'ammo', x: g.p.x - 3.2 * T, y: g.p.y - 1.1 * T },
];

document.fonts.ready.then(() => {
  render(canvas.getContext('2d')!, mini, g, { w, h, dpr, z, focus });
  document.body.dataset.ready = '1';
});
