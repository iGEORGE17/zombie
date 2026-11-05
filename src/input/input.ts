/** Unified input state. Devices write into it; the simulation only reads it. */
export class Input {
  keys: Record<string, boolean> = {};
  /** Mouse position in CSS pixels. */
  mouse = { x: 0, y: 0, down: false };
  /** True once the last pointer used was a finger; switches aiming to auto-aim. */
  touchMode = false;
  stick = { id: null as number | null, ox: 0, oy: 0, dx: 0, dy: 0 };
  fireHeld = false;

  /** Movement vector, length ≤ 1. `len` is the raw (pre-normalised) magnitude. */
  move() {
    const k = this.keys;
    let x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    let y = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (this.stick.id !== null) { x = this.stick.dx; y = this.stick.dy; }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, len };
  }

  /** Drop held keys/buttons, e.g. when focus leaves the iframe and keyup never arrives. */
  reset() {
    this.keys = {};
    this.mouse.down = false;
    this.fireHeld = false;
  }

  get firing() {
    return this.mouse.down || !!this.keys.Space || this.fireHeld;
  }
}
