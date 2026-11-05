import { DIFFICULTY, type DifficultyId } from '../config';

const KEY = 'antidote-run:difficulty';
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
