import { clamp, toMetres } from '../core/math';
import type { Game } from '../game/types';
import type { View } from './renderer';

type Ctx = CanvasRenderingContext2D;

/** Torch-light vignette around the player; tints sickly green as infection rises. */
export function drawDarkness(ctx: Ctx, g: Game, view: View, px: number, py: number) {
  const z = view.z, inf = g.p.inf / 100;
  const grad = ctx.createRadialGradient(px, py, 120 * z, px, py, 380 * z);
  grad.addColorStop(0, 'rgba(4,5,10,0)');
  grad.addColorStop(1, `rgba(${(4 + inf * 10) | 0},${(6 + inf * 18) | 0},10,.9)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, view.w, view.h);
}

export function drawHurtFlash(ctx: Ctx, g: Game, view: View) {
  if (g.p.hurt <= 0) return;
  ctx.fillStyle = `rgba(180,30,25,${g.p.hurt * 0.9})`;
  ctx.fillRect(0, 0, view.w, view.h);
}

/** Edge-of-screen arrow + distance pointing at the search zone when it is off screen. */
export function drawZoneArrow(ctx: Ctx, g: Game, view: View, px: number, py: number) {
  const z = g.zone;
  if (!z) return;
  const { w: vw, h: vh } = view, { cam } = g, m = 60;
  const zx = (z.x - cam.x) * cam.z, zy = (z.y - cam.y) * cam.z;
  if (zx >= 0 && zy >= 0 && zx <= vw && zy <= vh) return;

  const a = Math.atan2(zy - py, zx - px);
  const reach = Math.min(Math.abs((vw / 2 - m) / Math.cos(a)), Math.abs((vh / 2 - m - 40) / Math.sin(a)));
  const cx = clamp(px + Math.cos(a) * reach, m, vw - m), cy = clamp(py + Math.sin(a) * reach, m, vh - m);

  ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
  ctx.fillStyle = '#ffb547';
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffb547'; ctx.font = '600 11px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${toMetres(Math.hypot(z.x - g.p.x, z.y - g.p.y))} m`, cx - Math.cos(a) * 26, cy - Math.sin(a) * 26 + 4);
}
