import { CELL, MH, MW, T, Tile } from '../config';
import { type RNG, range } from '../core/rng';
import type { City } from './city';

export const isSolid = (t: number) => t === Tile.Building || t === Tile.Tree || t === Tile.Wall;
export const isRoad = (x: number, y: number) => x % CELL < 2 || y % CELL < 2;

export interface Body { x: number; y: number; r: number }
export interface Vec { x: number; y: number }

/** Tile queries and collision against a built city. */
export class World {
  readonly grid: Uint8Array;
  constructor(readonly city: City) {
    this.grid = city.grid;
  }

  tileAt(tx: number, ty: number): number {
    return tx < 0 || ty < 0 || tx >= MW || ty >= MH ? Tile.Wall : this.grid[ty * MW + tx];
  }

  solidPx(x: number, y: number) {
    return isSolid(this.tileAt(Math.floor(x / T), Math.floor(y / T)));
  }

  /** Box test of a circle's four corners against solid tiles. */
  hits(x: number, y: number, r: number) {
    return this.solidPx(x - r, y - r) || this.solidPx(x + r, y - r) || this.solidPx(x - r, y + r) || this.solidPx(x + r, y + r);
  }

  /** Axis-separated move so bodies slide along walls. */
  move(e: Body, dx: number, dy: number) {
    if (!this.hits(e.x + dx, e.y, e.r)) e.x += dx;
    if (!this.hits(e.x, e.y + dy, e.r)) e.y += dy;
  }

  /** Line of sight sampled every 10 px. */
  los(ax: number, ay: number, bx: number, by: number) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 10);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.solidPx(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
    }
    return true;
  }

  /** Centre of the tile under (x, y), or null if it is solid. */
  snap(x: number, y: number): Vec | null {
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    return isSolid(this.tileAt(tx, ty)) ? null : { x: (tx + 0.5) * T, y: (ty + 0.5) * T };
  }

  /** Random walkable, non-lab tile centre inside a tile rect (inclusive). */
  walkableTileIn(r: RNG, x0: number, y0: number, x1: number, y1: number): Vec {
    for (let k = 0; k < 200; k++) {
      const x = Math.floor(range(r, x0, x1 + 1)), y = Math.floor(range(r, y0, y1 + 1));
      const t = this.tileAt(x, y);
      if (!isSolid(t) && t !== Tile.Lab) return { x: (x + 0.5) * T, y: (y + 0.5) * T };
    }
    return { x: (x0 + 0.5) * T, y: (y0 + 0.5) * T };
  }
}
