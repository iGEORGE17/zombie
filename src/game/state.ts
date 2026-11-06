import { FlowField } from '../ai/flowfield';
import { DIFFICULTY, type EnemyKind, type Difficulty, LAB_C, MH, MW, PLAYER, SPAWN, T, TAU } from '../config';
import { type RNG, range } from '../core/rng';
import type { Level } from '../world/level';
import { mkEnemy } from './enemies';
import { PAGES, STORY, pageArea, setStage } from './missions';
import type { EndReason, Game, Hooks, ItemType } from './types';

export interface RunOptions {
  diff?: Difficulty;
  /** Run-time randomness; pass a seeded RNG for reproducible runs. */
  rng?: RNG;
}

export function newGame(level: Level, hooks: Hooks, { diff = DIFFICULTY.standard, rng = Math.random }: RunOptions = {}): Game {
  const { world } = level;
  const mk = (kind: EnemyKind, x: number, y: number) => mkEnemy(rng, diff, kind, x, y);
  const boss = mk('boss', LAB_C.x, LAB_C.y);
  const g: Game = {
    level, world, flow: new FlowField(), rng, hooks, diff, cam: { x: 0, y: 0, z: 1 },
    t: 0,
    p: { x: PLAYER.start.x, y: PLAYER.start.y, r: PLAYER.radius, hp: PLAYER.hp, inf: 0, ammo: diff.startAmmo, cd: 0, ang: 0, hurt: 0, swing: 0, target: null, power: 0, scavKills: 0 },
    enemies: [], bullets: [], items: [], fx: [], decals: [], popups: [], boss,
    pages: 0, pagePos: [], kills: 0, zone: null, goal: '',
    spawnT: SPAWN.initialDelay, flowT: 0, shake: 0, over: false,
  };

  g.pagePos = PAGES.map((pg) => world.walkableTileIn(rng, ...pageArea(pg.cell)));

  // Ash Crew camps guard each page, more for later pages
  g.pagePos.forEach((pp, k) => {
    for (let n = 0; n < 2 + k; n++) {
      const a = range(rng, 0, TAU), d = range(rng, 2.5, 5) * T;
      const q = world.snap(pp.x + Math.cos(a) * d, pp.y + Math.sin(a) * d);
      if (q) g.enemies.push(mk('scav', q.x, q.y));
    }
  });
  // Roaming scavs away from the start
  for (let n = 0; n < 5; n++) {
    const q = world.walkableTileIn(rng, 14, 1, MW - 2, MH - 2);
    g.enemies.push(mk('scav', q.x, q.y));
  }
  // Kane and his lab guards
  g.enemies.push(boss);
  for (let n = 0; n < 3; n++) g.enemies.push(mk('scav', LAB_C.x + range(rng, -60, 60), LAB_C.y + range(rng, -60, 60)));
  // Supplies
  const supply: ItemType[] = ['ammo', 'ammo', 'med', 'vial'];
  for (let n = 0; n < 26; n++) {
    const q = world.walkableTileIn(rng, 1, 1, MW - 2, MH - 2);
    g.items.push({ type: supply[n % supply.length], x: q.x, y: q.y });
  }
  // A few walkers near the start
  for (let n = 0; n < 6; n++) {
    const q = world.walkableTileIn(rng, 4, 4, 20, 20);
    g.enemies.push(mk('walker', q.x, q.y));
  }

  setStage(g);
  g.flow.compute(world.grid, g.p.x, g.p.y);
  hooks.radio('Command', STORY.intro);
  return g;
}

/** Ends the run once; later calls are ignored. */
export function endGame(g: Game, reason: EndReason) {
  if (g.over) return;
  g.over = true;
  g.hooks.end(reason);
}
