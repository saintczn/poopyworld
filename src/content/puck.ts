/** PUCK Arcade: the cabinets, the bar, and the tickets/high scores you collect. */
export const CABINETS: Array<{ key: string; game: string | null; title: string; x: number }> = [
  { key: 'cab-0', game: 'bitterbal-rush', title: 'Bitterbal Rush', x: 96 },
  { key: 'cab-1', game: 'goat-mayhem', title: 'Geitenchaos', x: 144 },
  { key: 'cab-2', game: 'slippery-panic', title: 'Gladde Paniek', x: 192 },
  { key: 'cab-3', game: 'strawberry-escape', title: 'Aardbeien Ontsnapping', x: 240 },
];

export const OPPONENTS = [
  { name: 'Femke', speed: 150, think: 260, greed: 0.9, careful: 0.6 },
  { name: 'Ricardo', speed: 125, think: 200, greed: 0.7, careful: 0.85 },
  { name: 'Lotte', speed: 170, think: 380, greed: 1.0, careful: 0.35 },
];

const K = 'poopyworld.puck.v1';
export type PuckSave = { tickets: number; best: Record<string, number>; plays: number };

export function loadPuck(): PuckSave {
  try { return { tickets: 0, best: {}, plays: 0, ...JSON.parse(localStorage.getItem(K) ?? '{}') }; } catch { return { tickets: 0, best: {}, plays: 0 }; }
}
export function savePuck(s: PuckSave) {
  try { localStorage.setItem(K, JSON.stringify(s)); } catch { /* fine */ }
}
