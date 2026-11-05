/** All tuning numbers live here so difficulty modes and content can scale them later. */

/** Tile size in world pixels. */
export const T = 32;
/** Map size in tiles. */
export const MW = 72;
export const MH = 56;
/** City block pitch in tiles: 2 road tiles + 7 block tiles. */
export const CELL = 9;
/** Block coordinates of the lab compound. */
export const LAB = { i: 6, j: 5 };
export const LAB_C = { x: (LAB.i * CELL + 5.5) * T, y: (LAB.j * CELL + 5.5) * T };
export const CITY_SEED = 20261028;
export const TAU = Math.PI * 2;

export const Tile = { Ground: 0, Building: 1, Park: 2, Tree: 3, Wall: 4, Lab: 5 } as const;
export type TileId = (typeof Tile)[keyof typeof Tile];

/** Display metres per tile (used in radio/arrow distances). */
export const METRES_PER_TILE = 3;

export const PLAYER = {
  start: { x: 10.5 * T, y: 10.5 * T },
  radius: 11,
  hp: 100,
  ammo: 90,
  speed: 165,
  /** Infection fills 0→100 in 7 minutes without vials. */
  infectionPerSec: 100 / 420,
  /** Auto-aim range for touch play. */
  autoAimRange: 430,
};

export const GUN = { cooldown: 0.17, speed: 760, life: 0.7, damage: 24, spread: 0.04, muzzle: 14 };
export const BAT = { cooldown: 0.42, swing: 0.18, range: 48, arc: 1.1, damage: 32 };

export type EnemyKind = 'walker' | 'runner' | 'brute' | 'scav' | 'boss';
export interface KindStats { hp: number; sp: number; r: number; dmg?: number; inf?: number }
export const KIND: Record<EnemyKind, KindStats> = {
  walker: { hp: 40, sp: 52, r: 11, dmg: 11, inf: 4 },
  runner: { hp: 26, sp: 108, r: 10, dmg: 8, inf: 3 },
  brute: { hp: 170, sp: 38, r: 15, dmg: 22, inf: 7 },
  scav: { hp: 60, sp: 72, r: 11 },
  boss: { hp: 650, sp: 62, r: 17 },
};
export const isZombie = (k: EnemyKind) => k !== 'scav' && k !== 'boss';

/** Max distance any enemy can see the player (still needs line of sight). */
export const SIGHT_RANGE = 480;
export const ZOMBIE = { biteCooldown: 0.85, chaseRange: 300, despawnTiles: 30 };
export const SCAV = {
  alertRange: 400, holdMax: 270, holdMin: 150, strafeSpeed: 0.6,
  fireRange: 460, fireCd: [0.9, 1.4] as const, spread: 0.08, damage: 9,
};
export const BOSS = {
  alertRange: 330, chargeRange: 300, chargeTime: 0.55, chargeCd: [4, 6] as const, chargeSpeed: 3.4,
  chargeDamage: 18, volleyCd: 1.35, volley: 5, volleyStep: 0.16, damage: 11,
};
export const ENEMY_BULLET = { speed: 400, life: 1.3 };

export const SPAWN = {
  initialDelay: 2,
  baseCap: 12, capPerSec: 1 / 8, capPerPage: 6, maxCap: 48,
  baseInterval: 0.8, intervalDecay: 1 / 400, minInterval: 0.25,
  minTiles: 13, maxTiles: 21, tries: 20,
  runnerAfter: 40, runnerChance: 0.3,
  bruteAfter: 120, bruteChance: 0.08,
};

export const PICKUP = { radius: 22, ammo: 24, med: 35, vial: 18, pageCure: 8 };
/** Seconds between flow-field rebuilds. */
export const FLOW_INTERVAL = 0.25;
