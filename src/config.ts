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
  speed: 165,
  /** Auto-aim range for touch play. */
  autoAimRange: 430,
};

/** Bullet physics shared by every firepower level. `spread` is random jitter per bullet. */
export const GUN = { speed: 760, life: 0.7, spread: 0.04, muzzle: 14 };

/**
 * Firepower upgrades, earned by killing Ash Crew scavengers (the armed, red-headed humans).
 * Level 0 is the starting pistol. `fan` is the angle between bullets of one trigger pull.
 */
export interface FirepowerLevel { name: string; damage: number; shots: number; fan: number; cooldown: number }
export const FIREPOWER = {
  killsPerLevel: 2,
  levels: [
    { name: 'Pistol', damage: 24, shots: 1, fan: 0, cooldown: 0.17 },
    { name: 'Hot rounds', damage: 32, shots: 1, fan: 0, cooldown: 0.17 },
    { name: 'Twin shot', damage: 32, shots: 2, fan: 0.08, cooldown: 0.16 },
    { name: 'Triple shot', damage: 36, shots: 3, fan: 0.12, cooldown: 0.15 },
    { name: 'Max power', damage: 44, shots: 3, fan: 0.12, cooldown: 0.12 },
  ] as FirepowerLevel[],
};
export const MAX_POWER = FIREPOWER.levels.length - 1;
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
  runnerChance: 0.3, bruteChance: 0.08,
};

export const PICKUP = { radius: 22, med: 35, vial: 18, pageCure: 8 };
/** Share of zombie drops that are ammo / med (rest are vials). Scavs always drop. */
export const ZOMBIE_DROP = { ammo: 0.54, med: 0.77 };
/** Seconds between flow-field rebuilds. */
export const FLOW_INTERVAL = 0.25;

/**
 * Difficulty presets. Multipliers are relative to the base numbers above;
 * `standard` is the original game exactly (all multipliers 1).
 */
export type DifficultyId = 'beginner' | 'standard';
export interface Difficulty {
  id: DifficultyId;
  label: string;
  blurb: string;
  /** Infection fill rate per second (100 = turned). */
  infectionPerSec: number;
  startAmmo: number;
  /** Rounds per ammo box. */
  ammoPickup: number;
  /** Chance a dead zombie drops something. */
  zombieDropChance: number;
  /** Multiplier on all enemy move speeds. */
  enemySpeed: number;
  /** Multiplier on all damage and bite infection taken. */
  enemyDamage: number;
  /** Multiplier on enemy shot / charge cooldowns (higher = slower). */
  enemyFireDelay: number;
  /** Multiplier on enemy bullet speed (lower = easier to dodge). */
  enemyBulletSpeed: number;
  /** Multiplier on time between horde spawns (higher = slower). */
  spawnInterval: number;
  /** Multiplier on the horde size cap. */
  spawnCap: number;
  /** Seconds before runners / brutes join the horde. */
  runnerAfter: number;
  bruteAfter: number;
}

export const DIFFICULTY: Record<DifficultyId, Difficulty> = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    blurb: 'Slower horde, 1000 rounds, 12 min before you turn.',
    infectionPerSec: 100 / 720,
    startAmmo: 1000,
    ammoPickup: 40,
    zombieDropChance: 0.22,
    enemySpeed: 0.75,
    enemyDamage: 0.65,
    enemyFireDelay: 1.5,
    enemyBulletSpeed: 0.75,
    spawnInterval: 1.6,
    spawnCap: 0.6,
    runnerAfter: 90,
    bruteAfter: 240,
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    blurb: 'The full outbreak. 7 min before you turn.',
    infectionPerSec: 100 / 420,
    startAmmo: 90,
    ammoPickup: 24,
    zombieDropChance: 0.13,
    enemySpeed: 1,
    enemyDamage: 1,
    enemyFireDelay: 1,
    enemyBulletSpeed: 1,
    spawnInterval: 1,
    spawnCap: 1,
    runnerAfter: 40,
    bruteAfter: 120,
  },
};
