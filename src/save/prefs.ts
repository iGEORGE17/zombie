import { DIFFICULTY, type DifficultyId } from '../config';
import type { AimMode } from '../input/input';

const KEY = 'antidote-run:difficulty';
const AIM_KEY = 'antidote-run:aim';
const DEFAULT: DifficultyId = 'beginner';

/** Last picked difficulty. Storage can be blocked (private mode), so failures fall back to the default. */
export function loadDifficulty(): DifficultyId {
  try {
    const v = localStorage.getItem(KEY);
    if (v && v in DIFFICULTY) return v as DifficultyId;
  } catch { /* storage unavailable */ }
  return DEFAULT;
}

export function saveDifficulty(id: DifficultyId) {
  try { localStorage.setItem(KEY, id); } catch { /* storage unavailable */ }
}

export function loadAimMode(): AimMode {
  try {
    if (localStorage.getItem(AIM_KEY) === 'manual') return 'manual';
  } catch { /* storage unavailable */ }
  return 'auto';
}

export function saveAimMode(mode: AimMode) {
  try { localStorage.setItem(AIM_KEY, mode); } catch { /* storage unavailable */ }
}
