import { ENEMY_BULLET, isZombie } from '../config';
import { reducedMotion } from '../core/env';
import { range } from '../core/rng';
import { burst } from './fx';
import { STORY } from './missions';
import type { Enemy, Game } from './types';

export function enemyShot(g: Game, e: Enemy, a: number, dmg: number) {
  const { speed, life } = ENEMY_BULLET;
  g.bullets.push({
    x: e.x + Math.cos(a) * (e.r + 4), y: e.y + Math.sin(a) * (e.r + 4),
    vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life, dmg, from: 'enemy',
  });
}

export function hurtPlayer(g: Game, dmg: number, inf: number) {
  const p = g.p;
  p.hp -= dmg; p.inf += inf; p.hurt = 0.25;
  if (!reducedMotion) g.shake = Math.min(8, g.shake + dmg * 0.4);
  burst(g, p.x, p.y, '#b3352c', 6);
}

/** `a` is the hit direction, used for knockback. */
export function damageEnemy(g: Game, e: Enemy, dmg: number, a: number) {
  e.hp -= dmg; e.hit = 0.08; e.alert = true;
  if (e.kind !== 'boss') g.world.move(e, Math.cos(a) * 5, Math.sin(a) * 5);
  const zombie = isZombie(e.kind);
  burst(g, e.x, e.y, zombie ? '#6f8a3c' : '#b3352c', 5);
  if (e.hp > 0 || e.dead) return;

  e.dead = true;
  g.kills++;
  if (g.decals.length > 160) g.decals.shift();
  g.decals.push({ x: e.x, y: e.y, r: e.r * range(g.rng, 1, 1.6), c: zombie ? 'rgba(70,92,40,.55)' : 'rgba(110,24,20,.55)' });

  const r = g.rng();
  if (e.kind === 'boss') {
    g.hooks.radio('Command', STORY.bossDown);
    burst(g, e.x, e.y, '#ffb547', 30, 220);
    g.hooks.objective(STORY.grabCure);
  } else if (e.kind === 'scav') {
    g.items.push({ type: r < 0.6 ? 'ammo' : r < 0.85 ? 'med' : 'vial', x: e.x, y: e.y });
  } else if (r < 0.13) {
    g.items.push({ type: r < 0.07 ? 'ammo' : r < 0.1 ? 'med' : 'vial', x: e.x, y: e.y });
  }
}

export function updateBullets(g: Game, dt: number) {
  const p = g.p, steps = 2;
  for (const b of g.bullets) {
    b.life -= dt;
    for (let s = 0; s < steps && b.life > 0; s++) {
      b.x += (b.vx * dt) / steps; b.y += (b.vy * dt) / steps;
      if (g.world.solidPx(b.x, b.y)) { b.life = 0; burst(g, b.x, b.y, '#9a9384', 4, 80); break; }
      if (b.from === 'player') {
        for (const e of g.enemies) {
          if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 3) {
            damageEnemy(g, e, b.dmg, Math.atan2(b.vy, b.vx));
            b.life = 0;
            break;
          }
        }
      } else if (Math.hypot(p.x - b.x, p.y - b.y) < p.r + 3) {
        hurtPlayer(g, b.dmg, 0);
        b.life = 0;
      }
    }
  }
  g.bullets = g.bullets.filter((b) => b.life > 0);
}
