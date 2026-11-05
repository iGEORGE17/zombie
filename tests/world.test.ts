import { describe, expect, it } from 'vitest';
import { FlowField } from '../src/ai/flowfield';
import { CITY_SEED, LAB_C, MH, MW, PLAYER } from '../src/config';
import { mulberry32 } from '../src/core/rng';
import { PAGES, pageArea } from '../src/game/missions';
import { buildCity } from '../src/world/city';
import { World, isSolid } from '../src/world/world';

const world = (seed: number) => new World(buildCity(mulberry32(seed)));

describe('city generation', () => {
  it('is deterministic for a seed', () => {
    expect(world(CITY_SEED).grid).toEqual(world(CITY_SEED).grid);
  });

  it('differs between seeds', () => {
    expect(world(1).grid).not.toEqual(world(2).grid);
  });

  it('has a solid border', () => {
    const w = world(CITY_SEED);
    for (let x = 0; x < MW; x++) expect(isSolid(w.tileAt(x, 0)) && isSolid(w.tileAt(x, MH - 1))).toBe(true);
    for (let y = 0; y < MH; y++) expect(isSolid(w.tileAt(0, y)) && isSolid(w.tileAt(MW - 1, y))).toBe(true);
  });
});

describe('reachability', () => {
  // Checked over many seeds so random-seed runs (Phase 2) are safe too.
  const seeds = [CITY_SEED, ...Array.from({ length: 50 }, (_, i) => i + 1)];

  it.each(seeds)('seed %i: start tile is walkable and the lab is reachable', (seed) => {
    const w = world(seed);
    const f = new FlowField();
    f.compute(w.grid, PLAYER.start.x, PLAYER.start.y);
    expect(w.solidPx(PLAYER.start.x, PLAYER.start.y)).toBe(false);
    expect(f.at(LAB_C.x, LAB_C.y)).toBeGreaterThan(0);
  });

  it.each(seeds)('seed %i: every walkable tile in each page block is reachable', (seed) => {
    const w = world(seed);
    const f = new FlowField();
    f.compute(w.grid, PLAYER.start.x, PLAYER.start.y);
    const stranded: string[] = [];
    for (const pg of PAGES) {
      const [x0, y0, x1, y1] = pageArea(pg.cell);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
          if (!isSolid(w.tileAt(x, y)) && f.dist[y * MW + x] < 0) stranded.push(`${x},${y}`);
    }
    expect(stranded).toEqual([]);
  });
});
