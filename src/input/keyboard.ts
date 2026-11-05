import type { Input } from './input';

/** Keys whose browser default (scrolling the host page) must not fire inside the game iframe. */
const SCROLL_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']);

const isFormControl = (t: EventTarget | null) =>
  t instanceof HTMLElement && t.closest('input, button, select, textarea') !== null;

/**
 * Uses physical key codes (KeyW…) so AZERTY players get ZQSD automatically.
 * Pause is P only: Escape is reserved by CrazyGames for leaving fullscreen.
 */
export function attachKeyboard(input: Input, onPause: () => void, onToggleAim: () => void) {
  addEventListener('keydown', (e) => {
    // Let focused buttons/radios keep Space/arrow behaviour (menu navigation).
    if (SCROLL_KEYS.has(e.code) && !isFormControl(e.target)) e.preventDefault();
    input.keys[e.code] = true;
    if (e.code === 'KeyP' && !e.repeat) onPause();
    if (e.code === 'KeyT' && !e.repeat) onToggleAim();
  });
  addEventListener('keyup', (e) => { input.keys[e.code] = false; });

  // No page scrolling from the wheel, except inside scrollable overlay screens on small iframes.
  addEventListener('wheel', (e) => {
    if (!(e.target instanceof Element && e.target.closest('.screen'))) e.preventDefault();
  }, { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}
