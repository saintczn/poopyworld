/**
 * The places on the world map, where you arrive when you travel there,
 * and what the game suggests doing next.
 */
import { TILE as T } from '../config';
import { loadMystery } from './mystery';
import { loadBali, ITEMS } from './bali';
import type { Arrival } from '../scenes/WorldScene';

export type PlaceId = 'villa' | 'heartwood' | 'puck' | 'hollowmere' | 'bali';

export type Place = {
  id: PlaceId; name: string; blurb: string;
  map: { x: number; y: number }; // on the 640x360 map
  scene: string; arrive: Arrival;
  island: 'home' | 'bali';
  unlocked: () => boolean;
};

export const PLACES: Place[] = [
  { id: 'villa', name: 'De Villa', blurb: 'Jullie huis, met de geiten, de vijver en Kroki.', map: { x: 176, y: 92 }, scene: 'garden', arrive: { x: 512, y: 300, facing: 'down' }, island: 'home', unlocked: () => true },
  { id: 'heartwood', name: 'Heartwood', blurb: 'Het dorp: plein, fontein, winkels en de bushalte naar het vliegveld.', map: { x: 192, y: 184 }, scene: 'village', arrive: { x: 22 * T, y: 11.5 * T, facing: 'down' }, island: 'home', unlocked: () => true },
  { id: 'puck', name: 'PUCK', blurb: 'Arcade en bar. Bitterbal Rush!', map: { x: 252, y: 214 }, scene: 'village', arrive: { x: 440, y: 352, facing: 'up' }, island: 'home', unlocked: () => true },
  { id: 'hollowmere', name: 'Hollowmere', blurb: 'Het landhuis op de heuvel. Er klopt iets niet...', map: { x: 360, y: 118 }, scene: 'manor-grounds', arrive: { x: 9 * T, y: 15.2 * T, facing: 'up' }, island: 'home', unlocked: () => loadMystery().letter },
  { id: 'bali', name: 'Bali', blurb: 'Strand, Warung Bitterbal, Casa Umalas, schildpadden en een gevaarlijk aapje.', map: { x: 516, y: 262 }, scene: 'bali', arrive: { x: 3.9 * T, y: 15.3 * T, facing: 'right' }, island: 'bali', unlocked: () => loadBali().visited },
];

/** Which place a scene belongs to. */
export function placeOf(scene: string): PlaceId {
  if (scene === 'garden' || scene === 'house') return 'villa';
  if (scene === 'puck' || scene === 'bitterbal-rush') return 'puck';
  if (scene === 'manor-grounds' || scene === 'manor') return 'hollowmere';
  if (scene === 'bali' || scene === 'casa' || scene === 'surf') return 'bali';
  return 'heartwood';
}

/** What to do next, and where. */
export function currentGoal(): { place: PlaceId; text: string } {
  const m = loadMystery();
  const b = loadBali();
  if (!m.letter) return { place: 'villa', text: 'Kijk in de brievenbus bij jullie villa.' };
  if (!m.seal1) return { place: 'hollowmere', text: 'Los het raadsel van landhuis Hollowmere op (oostkant van de onderste straat in Heartwood).' };
  if (!b.visited) return { place: 'heartwood', text: 'Neem de bus naar het vliegveld (bushalte in de onderste straat) en vlieg naar Bali.' };
  if (!b.started) return { place: 'bali', text: 'Ga langs bij Warung Bitterbal op het strand.' };
  if (!b.done) return { place: 'bali', text: `Zoek de spullen van Bram (${b.found.length}/${ITEMS.length} gevonden).` };
  if (!b.turtles) return { place: 'bali', text: 'Help de babyschildpadjes naar zee: de schildpaddenopvang staat op het strand van Bali.' };
  return { place: 'puck', text: 'Alles gedaan voor nu! Daag elkaar uit in PUCK of ga vissen. Wordt vervolgd...' };
}
