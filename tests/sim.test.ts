import { describe, expect, it } from 'vitest';
import { CITY_SEED, DIFFICULTY, type DifficultyId, KIND } from '../src/config';
import { mulberry32 } from '../src/core/rng';
import { newGame } from '../src/game/state';
import type { EndReason, Hooks } from '../src/game/types';
import { update } from '../src/game/update';
import { Input } from '../src/input/input';
import { buildCity } from '../src/world/city';
import type { Level } from '../src/world/level';
import { World } from '../src/world/world';

const level: Level = { seed: CITY_SEED, world: new World(buildCity(mulberry32(CITY_SEED))), layers: null };

function setup(seed = 7, diff: DifficultyId = 'standard') {
  const log: string[] = [];
  const ends: EndReason[] = [];
  const hooks: Hooks = { radio: (who) => log.push(who), objective: () => {}, end: (r) => ends.push(r) };
  const g = newGame(level, hooks, { diff: DIFFICULTY[diff], rng: mulberry32(seed) });
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

  it.each([['standard', 420], ['beginner', 720]] as const)('%s: infection alone kills in ~%i s', (mode, seconds) => {
    const { g, ends } = setup(7, mode);
    g.enemies = [g.boss]; // boss stays idle far away
    g.spawnT = Infinity;
    const input = new Input();
    let steps = 0;
    g.items = []; // no vials
    while (!g.over && steps < 20000) { update(g, input, 0.05); steps++; }
    expect(ends).toEqual(['inf']);
    expect(steps * 0.05).toBeCloseTo(seconds, 0);
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

describe('difficulty', () => {
  it('standard keeps the original tuning', () => {
    const d = DIFFICULTY.standard;
    expect([d.startAmmo, d.ammoPickup, d.zombieDropChance, d.runnerAfter, d.bruteAfter]).toEqual([90, 24, 0.13, 40, 120]);
    expect([d.enemySpeed, d.enemyDamage, d.enemyFireDelay, d.enemyBulletSpeed, d.spawnInterval, d.spawnCap]).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('beginner starts with more ammo and gets bigger ammo boxes', () => {
    const { g, log } = setup(7, 'beginner');
    expect(g.p.ammo).toBe(DIFFICULTY.beginner.startAmmo);
    g.items = [{ type: 'ammo', x: g.p.x, y: g.p.y }];
    g.enemies = [];
    update(g, new Input(), 0.01);
    expect(g.p.ammo).toBe(DIFFICULTY.beginner.startAmmo + DIFFICULTY.beginner.ammoPickup);
    expect(log).toContain('Pickup');
  });

  it('beginner enemies are slower and hit softer', () => {
    const std = setup(7, 'standard').g, beg = setup(7, 'beginner').g;
    const avg = (g: typeof std) => g.enemies.filter((e) => e.kind === 'scav').reduce((s, e) => s + e.sp, 0) / g.enemies.filter((e) => e.kind === 'scav').length;
    expect(avg(beg)).toBeLessThan(avg(std) * 0.85);
    expect(avg(beg)).toBeGreaterThan(KIND.scav.sp * 0.75 * 0.9 - 1e-9);

    for (const g of [std, beg]) {
      g.enemies = []; g.items = [];
      g.bullets.push({ x: g.p.x, y: g.p.y, vx: 0, vy: 0, life: 1, dmg: 20, from: 'enemy' });
      update(g, new Input(), 0.001);
    }
    expect(100 - std.p.hp).toBeCloseTo(20);
    expect(100 - beg.p.hp).toBeCloseTo(20 * DIFFICULTY.beginner.enemyDamage);
  });

  it('beginner horde builds up slower', () => {
    const count = (mode: DifficultyId) => {
      const { g } = setup(3, mode);
      g.enemies = [g.boss];
      g.items = [];
      g.p.hp = Infinity; // survive to count
      const input = new Input();
      for (let i = 0; i < 60 / 0.05; i++) update(g, input, 0.05);
      return g.enemies.length;
    };
    expect(count('beginner')).toBeLessThan(count('standard'));
  });
});
