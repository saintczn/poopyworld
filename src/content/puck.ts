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
export type PuckSave = { tickets: number; best: Record<string, number>; plays: number; prizes?: string[] };

export function loadPuck(): PuckSave {
  try { return { tickets: 0, best: {}, plays: 0, ...JSON.parse(localStorage.getItem(K) ?? '{}') }; } catch { return { tickets: 0, best: {}, plays: 0 }; }
}
export function savePuck(s: PuckSave) {
  try { localStorage.setItem(K, JSON.stringify(s)); } catch { /* fine */ }
}

/** Prizes at the counter. They show up in your living room once bought. */
export const PRIZES: Array<{ id: string; name: string; price: number; tex: string; frame?: string; home: { x: number; y: number }; solid?: [number, number]; wall?: boolean; depth?: number; lines: string[] }> = [
  { id: 'goat', name: 'Pluche geitje', price: 30, tex: 'bali-prize-goat', home: { x: 214, y: 186 }, lines: ['Een pluche geitje met een roze strikje.', 'Het lijkt verdacht veel op de witte geit. Die is er niet blij mee.'] },
  { id: 'turtle', name: 'Pluche schildpad', price: 40, tex: 'bali-prize-turtle', home: { x: 136, y: 300 }, depth: 2000, lines: ['Een zachte pluche schildpad op de bank.', 'Perfect om tegenaan te liggen tijdens een film. Ze heet nog niks. Of wel?'] },
  { id: 'dart', name: 'Aardbei-dartbord', price: 60, tex: 'bali-prize-dart', home: { x: 342, y: 84 }, wall: true, lines: ['Een dartbord in de vorm van een aardbei.', 'Eindelijk een goede reden om naar een aardbei te kijken: om erop te mikken.'] },
  { id: 'trophy', name: 'Gouden bitterbal-trofee', price: 100, tex: 'bali-prize-trophy', home: { x: 327, y: 122 }, lines: ['De Gouden Bitterbal. De hoogste eer van PUCK.', 'Op het bordje: "Kampioen. Femke is boos."'] },
  { id: 'arcade', name: 'Eigen PUCK-arcadekast', price: 200, tex: 'cab-0', home: { x: 412, y: 200 }, solid: [30, 14], lines: [] },
];

