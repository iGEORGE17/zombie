import { mulberry32 } from '../core/rng';
import { bake, type Layers } from './bake';
import { buildCity } from './city';
import { World } from './world';

export interface Level {
  seed: number;
  world: World;
  /** Null when running headless (tests). */
  layers: Layers | null;
}

export function makeLevel(seed: number): Level {
  const r = mulberry32(seed);
  const city = buildCity(r);
  return { seed, world: new World(city), layers: bake(city, r) };
}
