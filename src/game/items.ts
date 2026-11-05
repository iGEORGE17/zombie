import { PICKUP, PLAYER } from '../config';
import { compass, toMetres } from '../core/math';
import { PAGES, STORY, TOTAL_PAGES, setStage } from './missions';
import { endGame } from './state';
import type { Game } from './types';

export function updateItems(g: Game) {
  const p = g.p, radio = g.hooks.radio;
  for (const it of g.items) {
    if (Math.hypot(it.x - p.x, it.y - p.y) > PICKUP.radius) continue;
    switch (it.type) {
      case 'ammo':
        p.ammo += PICKUP.ammo; it.gone = true;
        radio('Pickup', `+${PICKUP.ammo} rounds.`);
        break;
      case 'med':
        if (p.hp < PLAYER.hp) {
          p.hp = Math.min(PLAYER.hp, p.hp + PICKUP.med); it.gone = true;
          radio('Pickup', `Field dressing. +${PICKUP.med} health.`);
        }
        break;
      case 'vial':
        p.inf = Math.max(0, p.inf - PICKUP.vial); it.gone = true;
        radio('Pickup', 'Suppressant vial. Infection pushed back.');
        break;
      case 'page': {
        it.gone = true;
        g.pages++;
        radio(`Journal page ${g.pages}/${TOTAL_PAGES}`, PAGES[it.n ?? 0].text, 'journal');
        setStage(g);
        if (g.pages < TOTAL_PAGES && g.zone) {
          const dx = g.zone.x - p.x, dy = g.zone.y - p.y;
          radio('Command', `Next search zone is about ${toMetres(Math.hypot(dx, dy))} m ${compass(dx, dy)}. Expect resistance.`);
        } else radio('Command', STORY.formulaDone);
        p.inf = Math.max(0, p.inf - PICKUP.pageCure);
        break;
      }
      case 'antidote':
        if (!g.boss.dead) {
          if (!it.warned) { it.warned = true; radio('Vault', STORY.vaultLocked); }
        } else { it.gone = true; endGame(g, 'win'); }
        break;
    }
  }
  g.items = g.items.filter((i) => !i.gone);
}
