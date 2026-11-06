import { describe, expect, it } from 'vitest';
import { CITY_SEED, DIFFICULTY, FIREPOWER, MAX_POWER } from '../src/config';
import { mulberry32 } from '../src/core/rng';
import { damageEnemy } from '../src/game/combat';
import { mkEnemy } from '../src/game/enemies';
import { killsToNextLevel } from '../src/game/firepower';
import { newGame } from '../src/game/state';
import { update } from '../src/game/update';
import { Input } from '../src/input/input';
import { buildCity } from '../src/world/city';
import type { Level } from '../src/world/level';
import { World } from '../src/world/world';

const level: Level = { seed: CITY_SEED, world: new World(buildCity(mulberry32(CITY_SEED))), layers: null };
function setup() {
  const radio: string[] = [];
  const g = newGame(level, { radio: (who) => radio.push(who), objective() {}, end() {} }, { diff: DIFFICULTY.standard, rng: mulberry32(9) });
  g.enemies = [];
  g.items = [];
  return { g, radio };
}
const kill = (g: ReturnType<typeof setup>['g'], kind: 'scav' | 'walker') => {
  const e = mkEnemy(g.rng, g.diff, kind, g.p.x + 300, g.p.y);
  damageEnemy(g, e, 1e6, 0);
};

describe('firepower', () => {
  it('starts at level 0 (the original pistol)', () => {
    const { g } = setup();
    expect(g.p.power).toBe(0);
    expect(FIREPOWER.levels[0]).toMatchObject({ damage: 24, shots: 1, cooldown: 0.17 });
  });

  it('every 2 Ash Crew kills raise it one level, capped at max', () => {
    const { g, radio } = setup();
    const levels: number[] = [];
    for (let i = 0; i < 12; i++) { kill(g, 'scav'); levels.push(g.p.power); }
    expect(levels).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 4, 4]);
    expect(radio.filter((w) => w.startsWith('Firepower'))).toHaveLength(MAX_POWER);
    expect(g.popups.length).toBeGreaterThan(0);
    expect(killsToNextLevel(g)).toBe(0);
  });

  it('zombie kills do not count', () => {
    const { g } = setup();
    for (let i = 0; i < 10; i++) kill(g, 'walker');
    expect(g.p.power).toBe(0);
  });

  it('higher levels fire more, harder bullets per trigger pull for one round of ammo', () => {
    for (let lv = 0; lv <= MAX_POWER; lv++) {
      const { g } = setup();
      g.p.power = lv;
      const input = new Input();
      input.aimMode = 'manual';
      input.keys.Space = true;
      const ammo = g.p.ammo;
      update(g, input, 0.001);
      const shots = g.bullets.filter((b) => b.from === 'player');
      expect(shots).toHaveLength(FIREPOWER.levels[lv].shots);
      expect(shots.every((b) => b.dmg === FIREPOWER.levels[lv].damage)).toBe(true);
      expect(g.p.ammo).toBe(ammo - 1);
    }
  });

  it('max firepower takes Kane down much faster than the pistol', () => {
    const dps = (lv: number) => {
      const f = FIREPOWER.levels[lv];
      return (f.damage * f.shots) / f.cooldown;
    };
    expect(dps(MAX_POWER) / dps(0)).toBeGreaterThan(5);
  });
});
