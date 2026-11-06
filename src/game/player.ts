import { BAT, FIREPOWER, GUN, PLAYER } from '../config';
import { angleDiff } from '../core/math';
import { range } from '../core/rng';
import type { Input } from '../input/input';
import { damageEnemy } from './combat';
import type { Enemy, Game } from './types';

/** How close (world px) the cursor must be to an enemy to hand-pick it over the auto target. */
const PICK_RADIUS = 48;

/**
 * Auto-aim target: an enemy the cursor is pointing at (manual pick) if any,
 * otherwise the nearest enemy in range with line of sight.
 */
export function pickTarget(g: Game, input: Input): Enemy | null {
  const p = g.p, { cam } = g;
  const cx = input.mouse.x / cam.z + cam.x, cy = input.mouse.y / cam.z + cam.y;
  let nearest: Enemy | null = null, nd = PLAYER.autoAimRange;
  let picked: Enemy | null = null, pd = Infinity;
  for (const e of g.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d >= PLAYER.autoAimRange || !g.world.los(p.x, p.y, e.x, e.y)) continue;
    if (d < nd) { nd = d; nearest = e; }
    if (!input.touchMode) {
      const dc = Math.hypot(e.x - cx, e.y - cy);
      if (dc < PICK_RADIUS + e.r && dc < pd) { pd = dc; picked = e; }
    }
  }
  return picked ?? nearest;
}

export function updatePlayer(g: Game, input: Input, dt: number) {
  const p = g.p;
  const mv = input.move();
  g.world.move(p, mv.x * PLAYER.speed * dt, mv.y * PLAYER.speed * dt);

  // Aim: auto-aim by default (always on touch); manual mode aims at the cursor.
  const auto = input.touchMode || input.aimMode === 'auto';
  p.target = auto ? pickTarget(g, input) : null;
  if (p.target) {
    p.ang = Math.atan2(p.target.y - p.y, p.target.x - p.x);
  } else if (input.touchMode) {
    if (mv.len > 0.2) p.ang = Math.atan2(mv.y, mv.x);
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

/** One trigger pull: 1 round of ammo, 1–3 bullets fanned out depending on firepower. */
function fireGun(g: Game) {
  const p = g.p, lv = FIREPOWER.levels[p.power];
  p.ammo--;
  p.cd = lv.cooldown;
  for (let i = 0; i < lv.shots; i++) {
    const a = p.ang + (i - (lv.shots - 1) / 2) * lv.fan + range(g.rng, -GUN.spread, GUN.spread);
    g.bullets.push({
      x: p.x + Math.cos(a) * GUN.muzzle, y: p.y + Math.sin(a) * GUN.muzzle,
      vx: Math.cos(a) * GUN.speed, vy: Math.sin(a) * GUN.speed, life: GUN.life, dmg: lv.damage, from: 'player',
    });
  }
  // Muzzle flash
  g.fx.push({ x: p.x + Math.cos(p.ang) * 18, y: p.y + Math.sin(p.ang) * 18, vx: 0, vy: 0, life: 0.05, max: 0.05, c: '#ffd27a', s: 7 });
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
