import { type EnemyKind, SPAWN, T, TAU, isZombie } from '../config';
import { range } from '../core/rng';
import { mkEnemy } from './enemies';
import type { Game } from './types';

/** Keep a horde ring 13–21 tiles out. Cap and rate rise with time and pages found. */
export function updateSpawner(g: Game, dt: number) {
  const p = g.p;
  g.spawnT -= dt;
  const zombies = g.enemies.filter((e) => isZombie(e.kind)).length;
  const cap = Math.min(SPAWN.maxCap, SPAWN.baseCap + g.t * SPAWN.capPerSec + g.pages * SPAWN.capPerPage);
  if (g.spawnT > 0 || zombies >= cap) return;

  g.spawnT = Math.max(SPAWN.minInterval, SPAWN.baseInterval - g.t * SPAWN.intervalDecay);
  for (let k = 0; k < SPAWN.tries; k++) {
    const a = range(g.rng, 0, TAU), d = range(g.rng, SPAWN.minTiles, SPAWN.maxTiles) * T;
    const q = g.world.snap(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    // Only spawn where the horde can actually reach the player
    if (q && g.flow.at(q.x, q.y) > 0) {
      g.enemies.push(mkEnemy(g.rng, pickKind(g), q.x, q.y));
      break;
    }
  }
}

function pickKind(g: Game): EnemyKind {
  const r = g.rng();
  if (g.t > SPAWN.bruteAfter && r < SPAWN.bruteChance) return 'brute';
  if (g.t > SPAWN.runnerAfter && r < SPAWN.runnerChance) return 'runner';
  return 'walker';
}
