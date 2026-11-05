import { CELL, LAB_C, T, TAU } from '../config';
import { range } from '../core/rng';
import type { Game } from './types';

/** Campaign 1: Dr. Okoro's journal. `cell` is the city block [i, j] the page hides in. */
export const PAGES: { cell: [number, number]; text: string }[] = [
  { cell: [3, 2], text: 'Day 11. The Ash Crew raided my lab for the serum. I split the formula into three pages so Kane can never sell it whole. Page two is hidden further east.' },
  { cell: [6, 1], text: "Day 12. The finished antidote is sealed in the lab courtyard. It only unlocks with the full formula. Kane's men patrol near my last page, south-west." },
  { cell: [2, 5], text: 'Day 14. Last page. The vault code is the final line of the formula. Kane is waiting at the lab. Whoever reads this: finish what I started.' },
];
export const TOTAL_PAGES = PAGES.length;

export const pageArea = ([i, j]: [number, number]) => [i * CELL, j * CELL, i * CELL + 8, j * CELL + 8] as const;

export const STORY = {
  intro: "Lazarus City is lost. Dr. Okoro's journal is the only route to the antidote. Page one is somewhere in the marked zone. Move.",
  formulaDone: 'Formula complete. The lab is in the south-east compound. Kane is dug in there.',
  vaultLocked: 'Locked. Kane holds the override. Take him down.',
  bossDown: 'Kane is down. The vault is open. Get the antidote.',
  grabCure: 'Grab the antidote in the lab courtyard',
  kaneTaunt: 'You want the cure? Come take it.',
};

/** Place the next objective item and its (offset) search zone. */
export function setStage(g: Game) {
  if (g.pages < TOTAL_PAGES) {
    const pp = g.pagePos[g.pages];
    g.items.push({ type: 'page', x: pp.x, y: pp.y, n: g.pages });
    const a = range(g.rng, 0, TAU), d = range(g.rng, 1, 4) * T;
    g.zone = { x: pp.x + Math.cos(a) * d, y: pp.y + Math.sin(a) * d, r: 6 * T };
    g.goal = `Find page ${g.pages + 1} of Dr. Okoro's journal in the search zone`;
  } else {
    g.zone = { x: LAB_C.x, y: LAB_C.y, r: 3 * T };
    g.items.push({ type: 'antidote', x: LAB_C.x, y: LAB_C.y });
    g.goal = 'Storm the lab. Defeat Kane and take the antidote';
  }
  g.hooks.objective(g.goal);
}
