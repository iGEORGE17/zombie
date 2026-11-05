import { LAB_C, MH, MW, T } from '../config';
import type { Game } from '../game/types';

export function drawMinimap(mctx: CanvasRenderingContext2D, g: Game) {
  const { width: w, height: h } = mctx.canvas, sx = w / MW, sy = h / MH;
  mctx.imageSmoothingEnabled = false;
  if (g.level.layers) mctx.drawImage(g.level.layers.mini, 0, 0, w, h);
  if (g.zone) {
    const z = g.zone;
    mctx.strokeStyle = '#ffb547'; mctx.fillStyle = 'rgba(255,181,71,.18)'; mctx.lineWidth = 1.5;
    mctx.beginPath(); mctx.arc((z.x / T) * sx, (z.y / T) * sy, (z.r / T) * sx, 0, 7); mctx.fill(); mctx.stroke();
  }
  mctx.fillStyle = '#5fe3d0'; mctx.fillRect((LAB_C.x / T) * sx - 3, (LAB_C.y / T) * sy - 3, 6, 6);
  // Only scavs that have spotted you show up, like radio chatter
  mctx.fillStyle = 'rgba(209,69,59,.9)';
  for (const e of g.enemies) if (e.kind === 'scav' && e.alert) mctx.fillRect((e.x / T) * sx - 1, (e.y / T) * sy - 1, 2.5, 2.5);
  mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.arc((g.p.x / T) * sx, (g.p.y / T) * sy, 3, 0, 7); mctx.fill();
}
