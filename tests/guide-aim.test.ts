import { describe, expect, it } from 'vitest';
import { CITY_SEED, DIFFICULTY, LAB_C, T } from '../src/config';
import { mulberry32 } from '../src/core/rng';
import { mkEnemy } from '../src/game/enemies';
import { nextHint } from '../src/game/guide';
import { pickTarget, updatePlayer } from '../src/game/player';
import { newGame } from '../src/game/state';
import { Input } from '../src/input/input';
import { buildCity } from '../src/world/city';
import type { Level } from '../src/world/level';
import { World } from '../src/world/world';

const level: Level = { seed: CITY_SEED, world: new World(buildCity(mulberry32(CITY_SEED))), layers: null };
const setup = () => {
  const g = newGame(level, { radio() {}, objective() {}, end() {} }, { diff: DIFFICULTY.beginner, rng: mulberry32(5) });
  g.enemies = [];
  return g;
};

describe('beginner ammo', () => {
  it('starts with 1000 rounds', () => {
    expect(setup().p.ammo).toBe(1000);
  });
});

describe('aiming', () => {
  // Player start (tile 10,10) is a road crossing: open lines of sight along x.
  const near = (g: ReturnType<typeof setup>, dx: number) => mkEnemy(g.rng, g.diff, 'walker', g.p.x + dx, g.p.y);

  it('auto-aim locks the nearest visible enemy by default', () => {
    const g = setup(), input = new Input();
    const a = near(g, 120), b = near(g, -60);
    g.enemies = [a, b];
    updatePlayer(g, input, 0.01);
    expect(g.p.target).toBe(b);
    expect(Math.cos(g.p.ang)).toBeCloseTo(-1, 3);
  });

  it('pointing the cursor at an enemy picks it over the nearest one', () => {
    const g = setup(), input = new Input();
    const far = near(g, 200), close = near(g, -60);
    g.enemies = [far, close];
    g.cam = { x: g.p.x - 400, y: g.p.y - 300, z: 1 };
    input.mouse.x = far.x - g.cam.x; input.mouse.y = far.y - g.cam.y;
    expect(pickTarget(g, input)).toBe(far);
  });

  it('manual mode aims at the cursor and never locks', () => {
    const g = setup(), input = new Input();
    input.aimMode = 'manual';
    g.enemies = [near(g, -60)];
    g.cam = { x: g.p.x - 400, y: g.p.y - 300, z: 1 };
    input.mouse.x = 400; input.mouse.y = 300 + 100; // straight below the player
    updatePlayer(g, input, 0.01);
    expect(g.p.target).toBeNull();
    expect(Math.sin(g.p.ang)).toBeCloseTo(1, 3);
  });

  it('ignores enemies out of range', () => {
    const g = setup();
    g.enemies = [near(g, 30 * T)];
    expect(pickTarget(g, new Input())).toBeNull();
  });
});

describe('guide hints', () => {
  it('opens with a controls tutorial (keyboard and touch variants)', () => {
    const g = setup();
    expect(nextHint(g).text).toMatch(/WASD/);
    expect(nextHint(g, true).text).toMatch(/stick/);
  });

  it('then points to the search zone with distance and direction', () => {
    const g = setup();
    g.t = 10;
    expect(nextHint(g).text).toMatch(/Head to the amber search zone, \d+ m [a-z-]+\. Page 1 of 3/);
  });

  it('inside the zone it gives the exact direction to the page', () => {
    const g = setup();
    g.t = 10;
    const page = g.items.find((i) => i.type === 'page')!;
    g.zone = { x: page.x, y: page.y, r: 20 * T };
    g.p.x = page.x + 8 * T; g.p.y = page.y;
    expect(nextHint(g).text).toMatch(/in the search zone\. Page 1 is \d+ m west/);
  });

  it('survival problems override the objective and are urgent', () => {
    const g = setup();
    g.t = 10;
    g.p.inf = 80;
    expect(nextHint(g)).toMatchObject({ urgent: true, text: expect.stringMatching(/Infection critical/) });
    g.p.inf = 0; g.p.hp = 20;
    expect(nextHint(g)).toMatchObject({ urgent: true, text: expect.stringMatching(/Low health/) });
    g.p.hp = 100; g.p.ammo = 0;
    expect(nextHint(g)).toMatchObject({ urgent: true, text: expect.stringMatching(/Out of ammo/) });
  });

  it('after all pages: go to the lab, then grab the antidote once Kane is down', () => {
    const g = setup();
    g.t = 10; g.pages = 3;
    g.items = g.items.filter((i) => i.type !== 'page');
    expect(nextHint(g).text).toMatch(/Head to the lab/);
    g.boss.dead = true;
    g.p.x = LAB_C.x - 20 * T; g.p.y = LAB_C.y;
    expect(nextHint(g).text).toMatch(/Grab the antidote.*\d+ m east/);
  });
});
