import { TAU } from '../config';
import { range } from '../core/rng';
import type { Game } from './types';

export function burst(g: Game, x: number, y: number, c: string, n: number, speed = 120) {
  for (let i = 0; i < n; i++) {
    const a = range(g.rng, 0, TAU), v = range(g.rng, 0.3, 1) * speed;
    g.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: range(g.rng, 0.25, 0.5), max: 0.5, c, s: range(g.rng, 1.5, 3) });
  }
}

export function updateFx(g: Game, dt: number) {
  // Damping as a function of dt (0.9 per 60 Hz frame) so particles look the same at 60/144/165 Hz.
  const damp = Math.pow(0.9, dt * 60);
  for (const f of g.fx) {
    f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= damp; f.vy *= damp;
  }
  g.fx = g.fx.filter((f) => f.life > 0);
  for (const u of g.popups) { u.life -= dt; u.y -= 28 * dt; }
  g.popups = g.popups.filter((u) => u.life > 0);
  g.shake = Math.max(0, g.shake - dt * 20);
}
