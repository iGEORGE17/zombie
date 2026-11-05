export type RNG = () => number;

/** Small, fast seeded PRNG. Same seed → same sequence. */
export function mulberry32(seed: number): RNG {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Float in [a, b). */
export const range = (r: RNG, a: number, b: number) => a + r() * (b - a);
/** Integer in [a, b]. */
export const rangeInt = (r: RNG, a: number, b: number) => Math.floor(range(r, a, b + 1));
