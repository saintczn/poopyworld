/** Fish you can catch in the garden pond. Rarer fish have a smaller chance (weight). */
export type Fish = { name: string; weight: number; text: string };

export const POND_FISH: Fish[] = [
  { name: 'Voorntje', weight: 30, text: 'Een klein zilver visje. Schattig.' },
  { name: 'Baarsje', weight: 25, text: 'Gestreept en eigenwijs.' },
  { name: 'Goudvis', weight: 15, text: 'Hoe komt die nou hier? Vast van Gilly.' },
  { name: 'Karper', weight: 12, text: 'Een dikke karper. Hij kijkt een beetje beledigd.' },
  { name: 'Gerrit', weight: 6, text: 'Volgens Gilly heet deze vis Gerrit. Wie zijn wij om dat tegen te spreken.' },
  { name: 'Oude laars', weight: 8, text: 'Geen vis. Wel een laars. Maat 43.' },
  { name: 'Bitterbal', weight: 3, text: 'Een... bitterbal? Onder water? Nog warm ook.' },
  { name: 'Regenboogkoi', weight: 1, text: 'Een glinsterende regenboogkoi! Super zeldzaam!' },
];

export function rollFish(): Fish {
  const total = POND_FISH.reduce((s, f) => s + f.weight, 0);
  let r = Math.random() * total;
  for (const f of POND_FISH) { r -= f.weight; if (r <= 0) return f; }
  return POND_FISH[0];
}

const KEY = 'poopyworld.fish.v1';
export function loadCatches(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}
export function saveCatch(name: string) {
  const c = loadCatches();
  c[name] = (c[name] ?? 0) + 1;
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* fine */ }
  return c;
}
