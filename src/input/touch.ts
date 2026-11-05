import type { Input } from './input';

const STICK_RADIUS = 50;

/** Virtual stick (first touch on the left half of the canvas) and a hold-to-fire button. */
export function attachTouch(input: Input, canvas: HTMLCanvasElement, knob: HTMLElement, fire: HTMLElement) {
  const s = input.stick;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    input.touchMode = true;
    if (e.clientX < innerWidth / 2 && s.id === null) {
      s.id = e.pointerId; s.ox = e.clientX; s.oy = e.clientY; s.dx = s.dy = 0;
    }
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerId !== s.id) return;
    let dx = e.clientX - s.ox, dy = e.clientY - s.oy;
    const d = Math.hypot(dx, dy);
    if (d > STICK_RADIUS) { dx *= STICK_RADIUS / d; dy *= STICK_RADIUS / d; }
    s.dx = dx / STICK_RADIUS; s.dy = dy / STICK_RADIUS;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== s.id) return;
    s.id = null; s.dx = s.dy = 0;
    knob.style.transform = '';
  };
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);

  fire.addEventListener('pointerdown', (e) => { e.preventDefault(); input.touchMode = true; input.fireHeld = true; });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave'] as const)
    fire.addEventListener(ev, () => { input.fireHeld = false; });
}
