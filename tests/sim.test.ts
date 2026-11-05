import { describe, expect, it } from 'vitest';
import { CITY_SEED, PLAYER } from '../src/config';
import { mulberry32 } from '../src/core/rng';
import { newGame } from '../src/game/state';
import type { EndReason, Hooks } from '../src/game/types';
import { update } from '../src/game/update';
import { Input } from '../src/input/input';
import { buildCity } from '../src/world/city';
import type { Level } from '../src/world/level';
import { World } from '../src/world/world';

const level: Level = { seed: CITY_SEED, world: new World(buildCity(mulberry32(CITY_SEED))), layers: null };

function setup(seed = 7) {
  const log: string[] = [];
  const ends: EndReason[] = [];
  const hooks: Hooks = { radio: (who) => log.push(who), objective: () => {}, end: (r) => ends.push(r) };
  const g = newGame(level, hooks, mulberry32(seed));
  return { g, log, ends };
}

describe('simulation (headless)', () => {
  it('sets up a run: 3 pages placed, boss present, first page item out', () => {
    const { g, log } = setup();
    expect(g.pagePos).toHaveLength(3);
    expect(g.enemies).toContain(g.boss);
    expect(g.items.filter((i) => i.type === 'page')).toHaveLength(1);
    expect(log).toContain('Command');
  });

  it('idling for 7 minutes ends the run exactly once, by infection or wounds', () => {
    const { g, ends } = setup();
    const input = new Input();
    for (let i = 0; i < (7 * 60) / 0.05 + 40 && !g.over; i++) update(g, input, 0.05);
    expect(g.over).toBe(true);
    for (let i = 0; i < 20; i++) update(g, input, 0.05);
    expect(ends).toHaveLength(1);
  });

  it('infection alone kills in ~420 s', () => {
    const { g, ends } = setup();
    g.enemies = [g.boss]; // boss stays idle far away
    g.spawnT = Infinity;
    const input = new Input();
    let steps = 0;
    while (!g.over && steps < 10000) { update(g, input, 0.05); steps++; }
    expect(ends).toEqual(['inf']);
    expect(steps * 0.05).toBeCloseTo(100 / PLAYER.infectionPerSec, 0);
  });

  it('picking up all pages unlocks the lab stage', () => {
    const { g } = setup();
    const input = new Input();
    for (let k = 0; k < 3; k++) {
      const page = g.items.find((i) => i.type === 'page')!;
      g.p.x = page.x; g.p.y = page.y;
      update(g, input, 0.01);
    }
    expect(g.pages).toBe(3);
    expect(g.items.some((i) => i.type === 'antidote')).toBe(true);
  });

  it('antidote only wins after Kane is dead', () => {
    const { g, ends } = setup();
    g.pages = 3;
    g.items = [{ type: 'antidote', x: g.p.x, y: g.p.y }];
    g.enemies = [g.boss];
    const input = new Input();
    update(g, input, 0.01);
    expect(ends).toEqual([]);
    g.boss.dead = true;
    update(g, input, 0.01);
    expect(ends).toEqual(['win']);
  });
});
