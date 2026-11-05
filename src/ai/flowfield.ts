import { MH, MW, T } from '../config';
import { isSolid } from '../world/world';

/**
 * Breadth-first distance field from the player's tile across walkable tiles.
 * Every chaser walks downhill on it, so one BFS serves all enemies.
 */
export class FlowField {
  /** Steps to the target tile; -1 = unreachable or solid. */
  readonly dist = new Int32Array(MW * MH);
  private readonly queue = new Int32Array(MW * MH);

  compute(grid: Uint8Array, x: number, y: number) {
    const { dist, queue: q } = this;
    dist.fill(-1);
    const s = Math.floor(y / T) * MW + Math.floor(x / T);
    dist[s] = 0;
    q[0] = s;
    let head = 0, tail = 1;
    const visit = (n: number, d: number) => {
      if (dist[n] < 0 && !isSolid(grid[n])) { dist[n] = d; q[tail++] = n; }
    };
    while (head < tail) {
      const c = q[head++], cx = c % MW, cy = (c / MW) | 0, d = dist[c] + 1;
      if (cx > 0) visit(c - 1, d);
      if (cx < MW - 1) visit(c + 1, d);
      if (cy > 0) visit(c - MW, d);
      if (cy < MH - 1) visit(c + MW, d);
    }
  }

  at(x: number, y: number) {
    return this.dist[Math.floor(y / T) * MW + Math.floor(x / T)];
  }

  /** Heading toward the neighbouring tile closest to the target, or null if stuck/arrived. */
  dir(x: number, y: number): number | null {
    const c = Math.floor(y / T) * MW + Math.floor(x / T), cd = this.dist[c];
    if (cd < 0) return null;
    let best = c, bd = cd;
    for (const n of [c - 1, c + 1, c - MW, c + MW]) {
      if (n >= 0 && n < MW * MH && this.dist[n] >= 0 && this.dist[n] < bd) { bd = this.dist[n]; best = n; }
    }
    if (best === c) return null;
    const gx = ((best % MW) + 0.5) * T, gy = (((best / MW) | 0) + 0.5) * T;
    return Math.atan2(gy - y, gx - x);
  }
}
