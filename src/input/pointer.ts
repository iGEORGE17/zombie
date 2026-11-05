import type { Input } from './input';

/** Mouse/pen aiming and firing on the canvas. Touch pointers are handled in touch.ts. */
export function attachPointer(input: Input, canvas: HTMLCanvasElement) {
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    input.touchMode = false;
    input.mouse.down = true;
    input.mouse.x = e.clientX; input.mouse.y = e.clientY;
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    input.mouse.x = e.clientX; input.mouse.y = e.clientY;
  });
  const up = (e: PointerEvent) => { if (e.pointerType !== 'touch') input.mouse.down = false; };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
}
