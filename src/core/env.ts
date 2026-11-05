/** Read once at boot; guarded so modules can be imported in Node tests. */
export const reducedMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
