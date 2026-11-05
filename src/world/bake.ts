import { CELL, LAB, MH, MW, T, Tile } from '../config';
import { type RNG, range, rangeInt } from '../core/rng';
import type { City } from './city';
import { isRoad } from './world';

export interface Layers {
  /** Full-map ground/roof art, drawn once. */
  ground: HTMLCanvasElement;
  /** 1 px per tile minimap base. */
  mini: HTMLCanvasElement;
}

/** Pre-render the static city. Uses `r` after buildCity so decoration is seed-stable. */
export function bake(city: City, r: RNG): Layers {
  const { grid, roofs, trees } = city;
  const ground = document.createElement('canvas');
  ground.width = MW * T;
  ground.height = MH * T;
  const g = ground.getContext('2d')!;
  g.fillStyle = '#16181f';
  g.fillRect(0, 0, ground.width, ground.height);

  for (let y = 0; y < MH; y++)
    for (let x = 0; x < MW; x++) {
      const t = grid[y * MW + x], px = x * T, py = y * T;
      if (t === Tile.Wall) {
        g.fillStyle = '#090a0e'; g.fillRect(px, py, T, T);
        g.strokeStyle = '#2a2414'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(px, py + T); g.lineTo(px + T, py); g.stroke();
        continue;
      }
      if (t === Tile.Park || t === Tile.Tree) {
        g.fillStyle = '#152219'; g.fillRect(px, py, T, T);
        g.fillStyle = '#1c2d20';
        for (let k = 0; k < 5; k++) g.fillRect(px + r() * T, py + r() * T, 2, 2);
        continue;
      }
      if (t === Tile.Lab) {
        g.fillStyle = '#1d2728'; g.fillRect(px, py, T, T);
        g.strokeStyle = '#263234'; g.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
        continue;
      }
      if (!isRoad(x, y)) {
        g.fillStyle = '#1e2129'; g.fillRect(px, py, T, T);
        g.strokeStyle = '#23262f'; g.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
      } else {
        g.fillStyle = 'rgba(255,255,255,.025)';
        for (let k = 0; k < 6; k++) g.fillRect(px + r() * T, py + r() * T, 1.5, 1.5);
      }
    }

  // Lane markings
  g.strokeStyle = '#3d3a2a'; g.lineWidth = 2; g.setLineDash([12, 14]);
  for (let i = 0; i * CELL < MW; i++) {
    const x = (i * CELL + 1) * T;
    if (x <= T) continue;
    g.beginPath(); g.moveTo(x, T); g.lineTo(x, (MH - 1) * T); g.stroke();
  }
  for (let j = 0; j * CELL < MH; j++) {
    const y = (j * CELL + 1) * T;
    if (y <= T) continue;
    g.beginPath(); g.moveTo(T, y); g.lineTo((MW - 1) * T, y); g.stroke();
  }
  g.setLineDash([]);

  // Wrecked cars (decoration only, not solid)
  for (let k = 0; k < 26; k++) {
    const x = rangeInt(r, 1, MW - 2), y = rangeInt(r, 1, MH - 2);
    if (grid[y * MW + x] !== Tile.Ground || !isRoad(x, y)) continue;
    g.save(); g.translate(x * T + T / 2, y * T + T / 2);
    const tilt = range(r, -0.6, 0.6);
    g.rotate(tilt + (r() < 0.5 ? Math.PI / 2 : 0));
    g.fillStyle = ['#3a2a2a', '#2b3340', '#3b3a30'][k % 3]; g.fillRect(-14, -7, 28, 14);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-6, -6, 12, 12);
    g.restore();
  }

  // Shadows
  g.fillStyle = 'rgba(0,0,0,.45)';
  for (const o of roofs) g.fillRect(o.x * T + 7, o.y * T + 7, o.w * T, o.h * T);
  for (const [x, y] of trees) { g.beginPath(); g.arc(x * T + T / 2 + 5, y * T + T / 2 + 5, 15, 0, 7); g.fill(); }

  // Roofs
  for (const o of roofs) {
    const px = o.x * T, py = o.y * T, w = o.w * T, h = o.h * T, l = 13 + o.s * 7;
    g.fillStyle = `hsl(222 9% ${l}%)`; g.fillRect(px, py, w, h);
    g.strokeStyle = `hsl(222 9% ${l + 7}%)`; g.lineWidth = 2; g.strokeRect(px + 3, py + 3, w - 6, h - 6);
    for (const [ax, ay, as] of o.ac) {
      const s = Math.min(w, h) * as;
      g.fillStyle = `hsl(222 7% ${l + 5}%)`; g.fillRect(px + ax * w, py + ay * h, s, s);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px + ax * w + s, py + ay * h + 3, 3, s);
    }
  }
  for (const [x, y] of trees) {
    const cx = x * T + T / 2, cy = y * T + T / 2;
    g.fillStyle = '#1f3524'; g.beginPath(); g.arc(cx, cy, 15, 0, 7); g.fill();
    g.fillStyle = '#2a4630'; g.beginPath(); g.arc(cx - 4, cy - 4, 8, 0, 7); g.fill();
  }

  // Lab compound: hazard stripes + serum cross
  const lx = (LAB.i * CELL + 2) * T, ly = (LAB.j * CELL + 2) * T, ls = 7 * T;
  g.save(); g.beginPath(); g.rect(lx, ly, ls, ls); g.clip(); g.lineWidth = 8;
  for (let k = -ls; k < ls * 2; k += 22) {
    g.strokeStyle = '#3d3317'; g.beginPath(); g.moveTo(lx + k, ly); g.lineTo(lx + k - ls, ly + ls); g.stroke();
  }
  g.restore();
  g.fillStyle = '#1d2728'; g.fillRect(lx + 12, ly + 12, ls - 24, ls - 24);
  g.strokeStyle = '#5fe3d0'; g.globalAlpha = 0.35; g.lineWidth = 3;
  g.beginPath(); g.arc(lx + ls / 2, ly + ls / 2, 52, 0, 7); g.stroke();
  g.lineWidth = 10; g.beginPath();
  g.moveTo(lx + ls / 2 - 22, ly + ls / 2); g.lineTo(lx + ls / 2 + 22, ly + ls / 2);
  g.moveTo(lx + ls / 2, ly + ls / 2 - 22); g.lineTo(lx + ls / 2, ly + ls / 2 + 22);
  g.stroke(); g.globalAlpha = 1;

  // Minimap base
  const mini = document.createElement('canvas');
  mini.width = MW; mini.height = MH;
  const m = mini.getContext('2d')!;
  const img = m.createImageData(MW, MH);
  const col: Record<number, [number, number, number]> = {
    [Tile.Ground]: [38, 41, 52], [Tile.Building]: [78, 84, 98], [Tile.Park]: [30, 52, 36],
    [Tile.Tree]: [40, 70, 46], [Tile.Wall]: [8, 9, 12], [Tile.Lab]: [40, 80, 78],
  };
  for (let i = 0; i < MW * MH; i++) {
    const t = grid[i], x = i % MW, y = (i / MW) | 0;
    const c = t === Tile.Ground && isRoad(x, y) ? [24, 26, 33] : col[t];
    img.data.set([...c, 255], i * 4);
  }
  m.putImageData(img, 0, 0);

  return { ground, mini };
}
