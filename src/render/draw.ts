import { reducedMotion } from '../core/env';
import type { Enemy, Game, Item, Player } from '../game/types';

type Ctx = CanvasRenderingContext2D;

export function drawPlayer(ctx: Ctx, p: Player) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
  if (p.swing > 0) {
    const k = 1 - p.swing / 0.18;
    ctx.strokeStyle = 'rgba(230,226,214,.6)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 40, -2 + k * 2, -1 + k * 2); ctx.stroke();
  }
  ctx.fillStyle = '#cfd3da'; ctx.fillRect(6, -2.5, 15, 5);
  ctx.fillStyle = '#d99a3f'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2d2118'; ctx.beginPath(); ctx.arc(1, 0, 6, 0, 7); ctx.fill();
  ctx.restore();
}

const ZOMBIE_COLOR: Record<string, string> = { walker: '#6e7d61', runner: '#8b8f58', brute: '#55644d' };

export function drawEnemy(ctx: Ctx, e: Enemy) {
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang);
  const flash = e.hit > 0;
  if (e.kind === 'scav' || e.kind === 'boss') {
    const big = e.kind === 'boss';
    ctx.fillStyle = '#14161b'; ctx.fillRect(6, -2.5, big ? 22 : 16, 5);
    ctx.fillStyle = flash ? '#fff' : big ? '#2b2c36' : '#3a2f2c';
    ctx.beginPath(); ctx.ellipse(0, 0, e.r - 1, e.r + 1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = big ? '#ffb547' : '#d1453b'; ctx.beginPath(); ctx.arc(1, 0, e.r * 0.55, 0, 7); ctx.fill();
    if (big) { ctx.strokeStyle = '#ffb547'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.r + 4, 0, 7); ctx.stroke(); }
  } else {
    const c = ZOMBIE_COLOR[e.kind];
    ctx.strokeStyle = flash ? '#fff' : c; ctx.lineWidth = e.kind === 'brute' ? 6 : 4; ctx.lineCap = 'round';
    const sw = Math.sin(e.wob) * 3;
    // Reaching arms
    ctx.beginPath();
    ctx.moveTo(2, -e.r * 0.7); ctx.lineTo(e.r + 7, -e.r * 0.5 + sw);
    ctx.moveTo(2, e.r * 0.7); ctx.lineTo(e.r + 7, e.r * 0.5 - sw);
    ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : c; ctx.beginPath(); ctx.arc(0, 0, e.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#3b4434'; ctx.beginPath(); ctx.arc(2, 0, e.r * 0.55, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff5a3c'; ctx.fillRect(e.r * 0.45, -3, 2, 2); ctx.fillRect(e.r * 0.45, 1, 2, 2);
  }
  ctx.restore();
}

/** Pages and the antidote are drawn in the `glow` pass, above the darkness. */
export function drawItem(ctx: Ctx, g: Game, it: Item, glow: boolean) {
  const bob = reducedMotion ? 0 : Math.sin(g.t * 3 + it.x) * 1.5;
  ctx.save(); ctx.translate(it.x, it.y + bob);
  if (glow) {
    const c = it.type === 'page' ? '255,181,71' : '95,227,208';
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 46);
    halo.addColorStop(0, `rgba(${c},.55)`); halo.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.fill();
    if (it.type === 'page') {
      ctx.rotate(0.2); ctx.fillStyle = '#efe6cf'; ctx.fillRect(-7, -9, 14, 18);
      ctx.fillStyle = '#7a6a4a'; for (let k = 0; k < 4; k++) ctx.fillRect(-5, -6 + k * 4, 10, 1.2);
    } else {
      ctx.fillStyle = '#1b2b2c'; ctx.fillRect(-10, -14, 20, 28);
      ctx.fillStyle = '#5fe3d0'; ctx.fillRect(-6, -10, 12, 20);
      if (!g.boss.dead) { ctx.strokeStyle = '#e2483d'; ctx.lineWidth = 2; ctx.strokeRect(-14, -18, 28, 36); }
    }
    ctx.restore();
    return;
  }
  if (it.type === 'ammo') {
    ctx.fillStyle = '#4a4f2c'; ctx.fillRect(-8, -6, 16, 12);
    ctx.fillStyle = '#ffb547'; ctx.fillRect(-5, -3, 2, 6); ctx.fillRect(-1, -3, 2, 6); ctx.fillRect(3, -3, 2, 6);
  } else if (it.type === 'med') {
    ctx.fillStyle = '#e6e2d6'; ctx.fillRect(-8, -7, 16, 14);
    ctx.fillStyle = '#e2483d'; ctx.fillRect(-2, -5, 4, 10); ctx.fillRect(-5, -2, 10, 4);
  } else if (it.type === 'vial') {
    ctx.fillStyle = 'rgba(157,180,106,.25)'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#9db46a'; ctx.fillRect(-3, -8, 6, 14);
    ctx.fillStyle = '#cfd3da'; ctx.fillRect(-3, -10, 6, 3);
  }
  ctx.restore();
}
