import { MH, MW, T } from '../config';
import { clamp } from '../core/math';
import { reducedMotion } from '../core/env';
import type { Game } from '../game/types';
import { drawEnemy, drawItem, drawPlayer } from './draw';
import { drawMinimap } from './minimap';
import { drawDarkness, drawHurtFlash, drawZoneArrow } from './overlay';

export interface View {
  w: number; h: number; dpr: number; z: number;
  /** Camera centre override (cover art); defaults to the player. */
  focus?: { x: number; y: number };
}

/** Size the canvas to the window. Zoom keeps ~17 tiles across the short side. */
export function measureView(canvas: HTMLCanvasElement): View {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  return { w, h, dpr, z: clamp(Math.min(w, h) / (17 * T), 0.62, 1.25) };
}

export function render(ctx: CanvasRenderingContext2D, mctx: CanvasRenderingContext2D, g: Game, view: View) {
  const { w: vw, h: vh, dpr, z: Z } = view, p = g.p, ww = vw / Z, wh = vh / Z;
  const cam = g.cam;
  cam.z = Z;
  const focus = view.focus ?? p;
  cam.x = Math.max(0, Math.min(MW * T - ww, focus.x - ww / 2));
  cam.y = Math.max(0, Math.min(MH * T - wh, focus.y - wh / 2));
  const sx = (Math.random() - 0.5) * g.shake, sy = (Math.random() - 0.5) * g.shake;
  const toScreen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const toWorld = () => ctx.setTransform(dpr * Z, 0, 0, dpr * Z, (-cam.x + sx) * dpr * Z, (-cam.y + sy) * dpr * Z);

  toScreen();
  ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, 0, vw, vh);

  // World pass
  toWorld();
  if (g.level.layers) {
    const x0 = Math.max(0, Math.floor(cam.x)), y0 = Math.max(0, Math.floor(cam.y));
    const w = Math.min(MW * T - x0, Math.ceil(ww) + 2), h = Math.min(MH * T - y0, Math.ceil(wh) + 2);
    ctx.drawImage(g.level.layers.ground, x0, y0, w, h, x0, y0, w, h);
  }
  for (const d of g.decals) { ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
  if (g.zone) {
    const z = g.zone, pulse = reducedMotion ? 0 : Math.sin(g.t * 2.5) * 4;
    ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,181,71,.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r + pulse, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const it of g.items) drawItem(ctx, g, it, false);
  for (const e of g.enemies) drawEnemy(ctx, e);
  drawPlayer(ctx, p);

  // Darkness
  toScreen();
  const px = (p.x - cam.x) * Z, py = (p.y - cam.y) * Z;
  drawDarkness(ctx, g, view, px, py);

  // Things that glow through the dark
  toWorld();
  for (const it of g.items) if (it.type === 'page' || it.type === 'antidote') drawItem(ctx, g, it, true);
  for (const b of g.bullets) {
    ctx.strokeStyle = b.from === 'player' ? '#ffd27a' : '#ff6a4d'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke();
  }
  for (const f of g.fx) {
    ctx.globalAlpha = Math.max(0, f.life / f.max); ctx.fillStyle = f.c;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.s, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const b = g.boss;
  if (!b.dead && b.alert) {
    ctx.fillStyle = '#000a'; ctx.fillRect(b.x - 30, b.y - 34, 60, 6);
    ctx.fillStyle = '#ffb547'; ctx.fillRect(b.x - 30, b.y - 34, (60 * b.hp) / b.max, 6);
  }

  // Screen-space overlays
  toScreen();
  drawHurtFlash(ctx, g, view);
  drawZoneArrow(ctx, g, view, px, py);
  drawMinimap(mctx, g);
}
