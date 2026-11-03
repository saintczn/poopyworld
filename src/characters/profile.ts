/** The player's name and look, kept in this browser until accounts exist (milestone 2). */
import { DEFAULT_LOOK, type Look } from './look';

export type Profile = { name: string; look: Look; ginger?: boolean };

const KEY = 'poopyworld.profile.v1';

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    return { ...p, look: { ...DEFAULT_LOOK, ...p.look } };
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage can be blocked; the game still works for this session */
  }
}
