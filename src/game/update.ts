import { FLOW_INTERVAL, PLAYER } from '../config';
import type { Input } from '../input/input';
import { updateBullets } from './combat';
import { updateEnemies } from './enemies';
import { updateFx } from './fx';
import { updateItems } from './items';
import { updatePlayer } from './player';
import { updateSpawner } from './spawner';
import { endGame } from './state';
import type { Game } from './types';

/** One simulation step. */
export function update(g: Game, input: Input, dt: number) {
  g.t += dt;
  updatePlayer(g, input, dt);
  g.p.inf += dt * PLAYER.infectionPerSec;

  g.flowT -= dt;
  if (g.flowT <= 0) {
    g.flow.compute(g.world.grid, g.p.x, g.p.y);
    g.flowT = FLOW_INTERVAL;
  }

  updateSpawner(g, dt);
  updateEnemies(g, dt);
  updateBullets(g, dt);
  g.enemies = g.enemies.filter((e) => !e.dead);
  updateItems(g);
  updateFx(g, dt);

  if (g.p.hp <= 0) endGame(g, 'hp');
  else if (g.p.inf >= 100) endGame(g, 'inf');
}
