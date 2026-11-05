import { $ } from '../core/dom';
import { formatTime } from '../core/math';
import { TOTAL_PAGES } from '../game/missions';
import type { EndReason, Game } from '../game/types';

const menu = $('menu'), end = $('end'), pause = $('pause');

const ENDINGS: Record<EndReason, { eye: string; title: string; text: string }> = {
  win: {
    eye: 'Signal restored', title: 'Cure secured',
    text: "You carried Dr. Okoro's antidote out of the lab. The radio tower can start mass production by dawn. Lazarus City has a chance.",
  },
  inf: {
    eye: 'Signal lost', title: 'You turned',
    text: 'The strain reached your bloodstream before the cure did. Grab suppressant vials to slow it next time.',
  },
  hp: {
    eye: 'Signal lost', title: 'Fallen',
    text: 'The streets took you. Kill from range, keep moving, and hoard field dressings.',
  },
};

export function hideScreens() {
  menu.hidden = end.hidden = pause.hidden = true;
}

export function setPaused(paused: boolean) {
  pause.hidden = !paused;
}

export function showEnd(g: Game, reason: EndReason) {
  const e = ENDINGS[reason];
  $('endEye').textContent = e.eye;
  $('endH').textContent = e.title;
  $('endP').textContent = e.text;
  $('sT').textContent = formatTime(g.t);
  $('sK').textContent = String(g.kills);
  $('sP').textContent = `${g.pages}/${TOTAL_PAGES}`;
  end.hidden = false;
  $('againBtn').focus();
}
