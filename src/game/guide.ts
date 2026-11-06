import { LAB_C, MAX_POWER, T } from '../config';
import { killsToNextLevel } from './firepower';
import { compass, toMetres } from '../core/math';
import { TOTAL_PAGES } from './missions';
import type { Game, Item, ItemType } from './types';

export interface Hint { text: string; urgent: boolean }

const dist = (g: Game, x: number, y: number) => Math.hypot(x - g.p.x, y - g.p.y);
/** "42 m north-east" from the player. */
const where = (g: Game, x: number, y: number) => `${toMetres(dist(g, x, y))} m ${compass(x - g.p.x, y - g.p.y)}`;

function nearest(g: Game, type: ItemType): Item | null {
  let best: Item | null = null, bd = Infinity;
  for (const it of g.items) {
    if (it.type !== type) continue;
    const d = dist(g, it.x, it.y);
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}

/**
 * What the player should do next. Survival problems win over the objective;
 * otherwise it walks them through the current stage with live distances and directions.
 */
export function nextHint(g: Game, touch = false): Hint {
  const p = g.p;

  if (p.inf >= 70) {
    const v = nearest(g, 'vial');
    return { urgent: true, text: v ? `Infection critical! Grab a green suppressant vial: nearest is ${where(g, v.x, v.y)}.` : 'Infection critical! Zombies sometimes drop green vials.' };
  }
  if (p.hp <= 35) {
    const m = nearest(g, 'med');
    return { urgent: true, text: m ? `Low health! Pick up a field dressing (white box, red cross): nearest is ${where(g, m.x, m.y)}.` : 'Low health! Keep your distance and shoot from range.' };
  }
  if (p.ammo === 0) {
    const a = nearest(g, 'ammo');
    return { urgent: true, text: `Out of ammo, you're swinging the bat. ${a ? `Nearest ammo crate: ${where(g, a.x, a.y)}.` : 'Scavengers drop ammo.'}` };
  }
  if (p.inf >= 45) {
    const v = nearest(g, 'vial');
    if (v && dist(g, v.x, v.y) < 15 * T) return { urgent: false, text: `Infection rising. A green vial is ${where(g, v.x, v.y)}.` };
  }

  if (g.t < 6) {
    return {
      urgent: false,
      text: touch
        ? 'Drag the left stick to move. Hold FIRE to shoot; it aims for you.'
        : 'Move with WASD. Hold Space or the mouse to shoot; auto-aim locks onto the nearest enemy.',
    };
  }

  if (g.t < 13 && g.p.power === 0) {
    return { urgent: false, text: 'Tip: the red-headed figures are the armed Ash Crew. Every 2 you kill powers up your gun, which you will need against their leader, Kane.' };
  }

  if (g.pages < TOTAL_PAGES) {
    const page = g.items.find((i) => i.type === 'page');
    const z = g.zone;
    if (page && z) {
      const n = g.pages + 1;
      if (dist(g, page.x, page.y) < 5 * T) return { urgent: false, text: `Page ${n} is right here, ${where(g, page.x, page.y)}. Walk over the glowing paper.` };
      if (dist(g, z.x, z.y) < z.r) return { urgent: false, text: `You're in the search zone. Page ${n} is ${where(g, page.x, page.y)}; look for the glow.` };
      return { urgent: false, text: `Head to the amber search zone, ${where(g, z.x, z.y)}. Page ${n} of ${TOTAL_PAGES} is inside.` };
    }
  }

  if (!g.boss.dead) {
    const power = p.power >= MAX_POWER ? 'Firepower is maxed.' : `Firepower Lv ${p.power}/${MAX_POWER}: ${killsToNextLevel(g)} more Ash Crew kill${killsToNextLevel(g) === 1 ? '' : 's'} to power up.`;
    if (g.boss.alert && dist(g, g.boss.x, g.boss.y) < 12 * T) return { urgent: false, text: `Kane charges when you get close. Keep moving sideways and keep firing. ${power}` };
    return { urgent: false, text: `All pages found! Head to the lab (teal square on the minimap), ${where(g, LAB_C.x, LAB_C.y)}. Defeat Kane to open the vault. ${power}` };
  }
  return { urgent: false, text: `Kane is down! Grab the antidote in the lab courtyard, ${where(g, LAB_C.x, LAB_C.y)}.` };
}
