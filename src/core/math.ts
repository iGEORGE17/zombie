import { METRES_PER_TILE, T } from '../config';

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Smallest absolute difference between two angles, in [0, π]. */
export const angleDiff = (a: number, b: number) => {
  const d = a - b;
  return Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
};

const DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
/** Screen-space direction name (y grows downward). */
export function compass(dx: number, dy: number) {
  const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360 + 22.5) % 360;
  return DIRS[Math.floor(a / 45)];
}

export const toMetres = (px: number) => Math.round((px / T) * METRES_PER_TILE);

export const formatTime = (sec: number, padMinutes = false) => {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${padMinutes ? String(m).padStart(2, '0') : m}:${String(s % 60).padStart(2, '0')}`;
};
