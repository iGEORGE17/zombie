import type { Input } from './input';

export function attachKeyboard(input: Input, onPause: () => void) {
  addEventListener('keydown', (e) => {
    input.keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyP' || e.code === 'Escape') onPause();
  });
  addEventListener('keyup', (e) => { input.keys[e.code] = false; });
}
