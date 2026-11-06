import { FIREPOWER, MAX_POWER } from '../config';
import { burst } from './fx';
import type { Game } from './types';

const PERKS = ['', 'Harder-hitting rounds.', 'Twin shot: two bullets per pull.', 'Triple shot: three bullets per pull.', 'Faster, heavier triple shot. Go take down Kane.'];

/** Every `killsPerLevel` Ash Crew kills raises firepower one level, up to MAX_POWER. */
export function onScavKilled(g: Game) {
  const p = g.p;
  p.scavKills++;
  const level = Math.min(MAX_POWER, Math.floor(p.scavKills / FIREPOWER.killsPerLevel));
  if (level <= p.power) return;
  p.power = level;
  burst(g, p.x, p.y, '#ffb547', 18, 160);
  g.popups.push({ x: p.x, y: p.y - 24, text: level === MAX_POWER ? 'MAX FIREPOWER' : 'FIREPOWER UP', life: 1.4, max: 1.4, c: '#ffb547' });
  g.hooks.radio(`Firepower Lv ${level}/${MAX_POWER}`, `${FIREPOWER.levels[level].name}. ${PERKS[level]}`, 'power');
}

/** Scav kills still needed for the next level (0 at max). */
export const killsToNextLevel = (g: Game) =>
  g.p.power >= MAX_POWER ? 0 : (g.p.power + 1) * FIREPOWER.killsPerLevel - g.p.scavKills;
