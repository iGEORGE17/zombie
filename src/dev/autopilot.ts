/**
 * Dev-only bot used to record store preview videos (tools/capture-media.mjs).
 * Walks the flow field toward the current objective and shoots the nearest visible enemy.
 * Never bundled in production: only imported behind `import.meta.env.DEV`.
 */
import { FlowField } from '../ai/flowfield';
import type { Game } from '../game/types';
import type { Input } from '../input/input';

export function makeAutopilot() {
  const flow = new FlowField();
  let replan = 0;
  return (g: Game, input: Input, dt: number) => {
    const p = g.p;
    const target = g.items.find((i) => i.type === 'page' || i.type === 'antidote') ?? g.zone;

    replan -= dt;
    if (target && replan <= 0) { flow.compute(g.world.grid, target.x, target.y); replan = 0.5; }
    let a = target ? flow.dir(p.x, p.y) : null;
    if (a === null && target) a = Math.atan2(target.y - p.y, target.x - p.x);
    input.keys = {};
    input.stick.id = a === null ? null : -1;
    input.stick.dx = a === null ? 0 : Math.cos(a);
    input.stick.dy = a === null ? 0 : Math.sin(a);

    let best = null, bd = 420;
    for (const e of g.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd && g.world.los(p.x, p.y, e.x, e.y)) { bd = d; best = e; }
    }
    const aim = best ?? { x: p.x + Math.cos(a ?? p.ang) * 100, y: p.y + Math.sin(a ?? p.ang) * 100 };
    input.mouse.x = (aim.x - g.cam.x) * g.cam.z;
    input.mouse.y = (aim.y - g.cam.y) * g.cam.z;
    input.mouse.down = best !== null;

    // Keep the recording alive; this is footage, not a balance test.
    p.hp = Math.max(p.hp, 45);
  };
}
