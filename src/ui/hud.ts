import { PLAYER } from '../config';
import { $ } from '../core/dom';
import { formatTime } from '../core/math';
import { nextHint } from '../game/guide';
import { TOTAL_PAGES } from '../game/missions';
import type { Game } from '../game/types';
import type { Input } from '../input/input';

export class Hud {
  private hp = $('hpF');
  private inf = $('infF');
  private ammo = $('ammo');
  private pages = $('pages');
  private kills = $('kills');
  private clock = $('clock');
  private obj = $('objT');
  private hint = $('hintT');
  private aim = $('aim');

  update(g: Game, input: Input) {
    const p = g.p;
    const h = nextHint(g, input.touchMode);
    if (this.hint.textContent !== h.text) this.hint.textContent = h.text;
    this.hint.classList.toggle('urgent', h.urgent);
    this.aim.textContent = input.touchMode || input.aimMode === 'auto' ? 'AUTO' : 'MANUAL';
    this.hp.style.width = `${Math.max(0, (p.hp / PLAYER.hp) * 100)}%`;
    this.inf.style.width = `${Math.min(100, p.inf)}%`;
    this.ammo.textContent = p.ammo > 0 ? String(p.ammo) : 'BAT';
    this.pages.textContent = `${g.pages} / ${TOTAL_PAGES}`;
    this.kills.textContent = String(g.kills);
    this.clock.textContent = formatTime(g.t, true);
  }

  objective(text: string) {
    this.obj.textContent = text;
  }
}
