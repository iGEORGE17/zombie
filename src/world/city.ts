import { CELL, LAB, MH, MW, Tile } from '../config';
import { type RNG, range, rangeInt } from '../core/rng';

/** A building roof: tile rect, shade 0..1, and rooftop AC units [x, y, size] as fractions. */
export interface Roof { x: number; y: number; w: number; h: number; s: number; ac: [number, number, number][] }
export interface City { grid: Uint8Array; roofs: Roof[]; trees: [number, number][] }

/**
 * Lay out the city on a CELL-pitch grid: 2-tile roads, 7×7 blocks.
 * Each block is a park (20%), or a building, sometimes split by an alley.
 * The RNG call order is part of the city's identity; changing it changes every seed.
 */
export function buildCity(r: RNG): City {
  const grid = new Uint8Array(MW * MH);
  const roofs: Roof[] = [];
  const trees: [number, number][] = [];
  for (let y = 0; y < MH; y++)
    for (let x = 0; x < MW; x++)
      grid[y * MW + x] = x === 0 || y === 0 || x === MW - 1 || y === MH - 1 ? Tile.Wall : Tile.Ground;
  const set = (x: number, y: number, v: number) => {
    if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1) grid[y * MW + x] = v;
  };

  for (let j = 0; j * CELL + 2 < MH - 1; j++)
    for (let i = 0; i * CELL + 2 < MW - 1; i++) {
      const x0 = i * CELL + 2, y0 = j * CELL + 2;
      const x1 = Math.min(x0 + 6, MW - 2), y1 = Math.min(y0 + 6, MH - 2);

      if (i === LAB.i && j === LAB.j) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, Tile.Lab);
        for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
          set(cx, cy, Tile.Building);
          roofs.push({ x: cx, y: cy, w: 1, h: 1, s: 0.2, ac: [] });
        }
        continue;
      }

      if (r() < 0.2) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, Tile.Park);
        const n = rangeInt(r, 3, 5);
        for (let k = 0; k < n; k++) {
          const tx = rangeInt(r, x0 + 1, x1 - 1), ty = rangeInt(r, y0 + 1, y1 - 1);
          set(tx, ty, Tile.Tree);
          trees.push([tx, ty]);
        }
        continue;
      }

      const ix0 = x0 + rangeInt(r, 0, 1), iy0 = y0 + rangeInt(r, 0, 1);
      const ix1 = x1 - rangeInt(r, 0, 1), iy1 = y1 - rangeInt(r, 0, 1);
      for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) set(x, y, Tile.Building);
      const roof = (x: number, y: number, w: number, h: number) => {
        if (w < 1 || h < 1) return;
        const ac: Roof['ac'] = [];
        const n = rangeInt(r, 1, 3);
        for (let k = 0; k < n; k++) ac.push([range(r, 0.15, 0.7), range(r, 0.15, 0.7), range(r, 0.12, 0.22)]);
        roofs.push({ x, y, w, h, ac, s: r() });
      };
      if (r() < 0.45 && ix1 - ix0 >= 4 && iy1 - iy0 >= 4) {
        if (r() < 0.5) {
          const ax = rangeInt(r, ix0 + 2, ix1 - 2);
          for (let y = iy0; y <= iy1; y++) set(ax, y, Tile.Ground);
          roof(ix0, iy0, ax - ix0, iy1 - iy0 + 1);
          roof(ax + 1, iy0, ix1 - ax, iy1 - iy0 + 1);
        } else {
          const ay = rangeInt(r, iy0 + 2, iy1 - 2);
          for (let x = ix0; x <= ix1; x++) set(x, ay, Tile.Ground);
          roof(ix0, iy0, ix1 - ix0 + 1, ay - iy0);
          roof(ix0, ay + 1, ix1 - ix0 + 1, iy1 - ay);
        }
      } else roof(ix0, iy0, ix1 - ix0 + 1, iy1 - iy0 + 1);
    }
  return { grid, roofs, trees };
}
