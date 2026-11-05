import { BOSS, type EnemyKind, KIND, SCAV, SIGHT_RANGE, T, ZOMBIE } from '../config';
import { type RNG, range } from '../core/rng';
import { enemyShot, hurtPlayer } from './combat';
import { STORY } from './missions';
import type { Enemy, Game } from './types';

export function mkEnemy(r: RNG, kind: EnemyKind, x: number, y: number): Enemy {
  const k = KIND[kind];
  return {
    kind, x, y, r: k.r, hp: k.hp, max: k.hp, sp: k.sp * range(r, 0.9, 1.1),
    cd: range(r, 0, 1), hit: 0, ang: 0, alert: false, wob: range(r, 0, 6),
    charge: 0, chargeCd: 4, dead: false,
  };
}

/** Returns a heading (or null to stand still) and the speed multiplier for this frame. */
type Steer = { ang: number | null; sp: number };

function scav(g: Game, e: Enemy, dx: number, dy: number, d: number, see: boolean): Steer {
  let ang: number | null, sp = e.sp;
  if (!see || d > SCAV.holdMax) ang = see ? Math.atan2(dy, dx) : g.flow.dir(e.x, e.y);
  else if (d < SCAV.holdMin) ang = Math.atan2(-dy, -dx);
  else {
    // Strafe around the player at mid range
    ang = Math.atan2(dy, dx) + (Math.PI / 2) * (Math.sin(e.wob * 0.3) > 0 ? 1 : -1);
    sp *= SCAV.strafeSpeed;
  }
  if (see && d < SCAV.fireRange && e.cd <= 0) {
    e.cd = range(g.rng, ...SCAV.fireCd);
    enemyShot(g, e, Math.atan2(dy, dx) + range(g.rng, -SCAV.spread, SCAV.spread), SCAV.damage);
  }
  return { ang, sp };
}

function boss(g: Game, e: Enemy, dt: number, dx: number, dy: number, d: number, see: boolean): Steer {
  const p = g.p;
  let sp = e.sp;
  e.chargeCd -= dt;
  if (e.charge > 0) { e.charge -= dt; sp *= BOSS.chargeSpeed; }
  if (e.chargeCd <= 0 && see && d < BOSS.chargeRange) {
    e.charge = BOSS.chargeTime;
    e.chargeCd = range(g.rng, ...BOSS.chargeCd);
    g.hooks.radio('Kane', STORY.kaneTaunt);
  }
  const ang = see ? Math.atan2(dy, dx) : g.flow.dir(e.x, e.y);
  if (see && e.cd <= 0 && e.charge <= 0) {
    e.cd = BOSS.volleyCd;
    const b = Math.atan2(dy, dx), half = (BOSS.volley - 1) / 2;
    for (let k = -half; k <= half; k++) enemyShot(g, e, b + k * BOSS.volleyStep, BOSS.damage);
  }
  if (d < e.r + p.r + 4 && e.charge > 0) { hurtPlayer(g, BOSS.chargeDamage, 0); e.charge = 0; }
  return { ang, sp };
}

function zombie(g: Game, e: Enemy, dx: number, dy: number, d: number, see: boolean): Steer {
  let ang = d < T * 1.6 || (d < ZOMBIE.chaseRange && see) ? Math.atan2(dy, dx) : g.flow.dir(e.x, e.y);
  if (ang !== null) ang += Math.sin(e.wob) * 0.25;
  if (d < e.r + g.p.r + 5 && e.cd <= 0) {
    const k = KIND[e.kind];
    e.cd = ZOMBIE.biteCooldown;
    hurtPlayer(g, k.dmg ?? 0, k.inf ?? 0);
  }
  return { ang, sp: e.sp };
}

export function updateEnemies(g: Game, dt: number) {
  const p = g.p;
  for (const e of g.enemies) {
    if (e.dead) continue;
    e.cd -= dt; e.hit = Math.max(0, e.hit - dt); e.wob += dt * 6;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    const human = e.kind === 'scav' || e.kind === 'boss';
    if (!human && d > ZOMBIE.despawnTiles * T) { e.dead = true; continue; }
    const see = d < SIGHT_RANGE && g.world.los(e.x, e.y, p.x, p.y);

    let s: Steer;
    if (human) {
      const alertRange = e.kind === 'boss' ? BOSS.alertRange : SCAV.alertRange;
      if (!e.alert && ((d < alertRange && see) || e.hp < e.max)) e.alert = true;
      if (!e.alert) continue;
      s = e.kind === 'scav' ? scav(g, e, dx, dy, d, see) : boss(g, e, dt, dx, dy, d, see);
    } else s = zombie(g, e, dx, dy, d, see);

    if (s.ang !== null) {
      e.ang = s.ang;
      if (d > e.r + p.r) g.world.move(e, Math.cos(s.ang) * s.sp * dt, Math.sin(s.ang) * s.sp * dt);
    }
  }
  separate(g);
}

/** Push overlapping enemies apart. O(n²); fine at the current ~60-entity cap. */
function separate(g: Game) {
  const E = g.enemies;
  for (let i = 0; i < E.length; i++)
    for (let j = i + 1; j < E.length; j++) {
      const a = E[i], b = E[j], dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0.01) {
        const d = Math.sqrt(d2), o = (rr - d) / 2, nx = dx / d, ny = dy / d;
        g.world.move(a, -nx * o, -ny * o);
        g.world.move(b, nx * o, ny * o);
      }
    }
}
