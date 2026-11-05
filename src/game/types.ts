import type { FlowField } from '../ai/flowfield';
import type { Difficulty, EnemyKind } from '../config';
import type { RNG } from '../core/rng';
import type { Level } from '../world/level';
import type { Vec, World } from '../world/world';

export interface Player {
  x: number; y: number; r: number;
  hp: number; inf: number; ammo: number;
  /** Weapon cooldown, aim angle, hurt flash and bat swing timers. */
  cd: number; ang: number; hurt: number; swing: number;
  /** Current auto-aim lock (null in manual aim or with nothing in range). */
  target: Enemy | null;
}

export interface Enemy {
  kind: EnemyKind;
  x: number; y: number; r: number;
  hp: number; max: number; sp: number;
  cd: number; hit: number; ang: number; wob: number;
  alert: boolean;
  /** Boss only. */
  charge: number; chargeCd: number;
  dead: boolean;
}

export interface Bullet { x: number; y: number; vx: number; vy: number; life: number; dmg: number; from: 'player' | 'enemy' }

export type ItemType = 'ammo' | 'med' | 'vial' | 'page' | 'antidote';
export interface Item { type: ItemType; x: number; y: number; n?: number; gone?: boolean; warned?: boolean }

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number }
export interface Decal { x: number; y: number; r: number; c: string }
export interface Zone { x: number; y: number; r: number }
export interface Camera { x: number; y: number; z: number }

export type EndReason = 'win' | 'hp' | 'inf';

/** Outbound side effects. The simulation never touches the DOM directly. */
export interface Hooks {
  radio(who: string, text: string, cls?: string): void;
  objective(text: string): void;
  end(reason: EndReason): void;
}

export interface Game {
  level: Level;
  world: World;
  flow: FlowField;
  /** Run-time randomness (spawns, drops, spread). World gen uses its own seeded RNG. */
  rng: RNG;
  hooks: Hooks;
  diff: Difficulty;
  /** Written by the renderer each frame; read by mouse aiming. */
  cam: Camera;

  t: number;
  p: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  items: Item[];
  fx: Particle[];
  decals: Decal[];
  boss: Enemy;

  pages: number;
  pagePos: Vec[];
  kills: number;
  zone: Zone | null;
  goal: string;

  spawnT: number;
  flowT: number;
  shake: number;
  over: boolean;
}
