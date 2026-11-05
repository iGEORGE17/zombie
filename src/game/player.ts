import { BAT, GUN, PLAYER } from '../config';
import { angleDiff } from '../core/math';
import { range } from '../core/rng';
import type { Input } from '../input/input';
import { damageEnemy } from './combat';
import type { Game } from './types';

export function updatePlayer(g: Game, input: Input, dt: number) {
  const p = g.p;
  const mv = input.move();
  g.world.move(p, mv.x * PLAYER.speed * dt, mv.y * PLAYER.speed * dt);

  // Aim: touch auto-targets the nearest visible enemy; mouse aims at the cursor in world space.
  if (input.touchMode) {
    let best = null, bd = PLAYER.autoAimRange;
    for (const e of g.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd && g.world.los(p.x, p.y, e.x, e.y)) { bd = d; best = e; }
    }
    if (best) p.ang = Math.atan2(best.y - p.y, best.x - p.x);
    else if (mv.len > 0.2) p.ang = Math.atan2(mv.y, mv.x);
  } else {
    const { cam } = g;
    p.ang = Math.atan2(input.mouse.y / cam.z + cam.y - p.y, input.mouse.x / cam.z + cam.x - p.x);
  }

  p.cd -= dt;
  p.swing = Math.max(0, p.swing - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  if (input.firing && p.cd <= 0) {
    if (p.ammo > 0) fireGun(g);
    else swingBat(g);
  }
}

function fireGun(g: Game) {
  const p = g.p;
  p.ammo--;
  p.cd = GUN.cooldown;
  const a = p.ang + range(g.rng, -GUN.spread, GUN.spread);
  g.bullets.push({
    x: p.x + Math.cos(a) * GUN.muzzle, y: p.y + Math.sin(a) * GUN.muzzle,
    vx: Math.cos(a) * GUN.speed, vy: Math.sin(a) * GUN.speed, life: GUN.life, dmg: GUN.damage, from: 'player',
  });
  // Muzzle flash
  g.fx.push({ x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18, vx: 0, vy: 0, life: 0.05, max: 0.05, c: '#ffd27a', s: 7 });
}

function swingBat(g: Game) {
  const p = g.p;
  p.cd = BAT.cooldown;
  p.swing = BAT.swing;
  for (const e of g.enemies) {
    const dx = e.x - p.x, dy = e.y - p.y;
    if (Math.hypot(dx, dy) < BAT.range + e.r && angleDiff(Math.atan2(dy, dx), p.ang) < BAT.arc) damageEnemy(g, e, BAT.damage, p.ang);
  }
}
