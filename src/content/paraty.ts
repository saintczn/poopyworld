/**
 * Paraty: the old colonial town on the Costa Verde, where the family comes from.
 * Cobblestones, white houses with coloured doors, the church of Santa Rita by the water,
 * schooners in the bay, a natural rock waterslide in the jungle, and the tide that floods the streets.
 */
export const MAP_W = 46;
export const MAP_H = 34;
export const SEA = 26;

/** Houses: texture, x and y of the top-left corner (tiles). */
export const HOUSES: Array<[string, number, number]> = [
  ['br-casa-blue', 7, 5.4], ['br-sobrado-green', 12.2, 5.4], ['br-casa-yellow', 17.4, 5.4], ['br-sobrado-red', 22.6, 5.4], ['br-casa-purple', 27.8, 5.4],
  ['br-sobrado-teal', 7, 13.2], ['br-casa-yellow', 12.2, 13.2], ['br-casa-blue', 23.4, 13.2], ['br-sobrado-red', 28.6, 13.2],
];
export const church = { x: 34.4, y: 15.0 };       // top-left
export const waterfall = { x: 0.5, y: 2.0 };      // top-left
export const praca = { x: 20.2, y: 15.6 };        // the big tree in the square
export const doces = { x: 18.6, y: 19.4 };
export const busStop = { x: 41.6, y: 11.6 };
export const captain = { x: 15.0, y: 24.6 };
export const boats: Array<[string, number, number]> = [['br-escuna-a', 9, 27.6], ['br-escuna-b', 15, 27.9], ['br-escuna-c', 21.5, 27.5]];
export const canoes: Array<[number, number]> = [[27.5, 26.9], [30.5, 27.4], [6.2, 26.8]];
export const islands: Array<[number, number, number]> = [[8, 31.5, 60], [24, 32.2, 80], [38, 31, 54]];

/** Cobblestone areas (tiles). */
export const stones = [
  { x: 6, y: 4.6, w: 34, h: 21 },
];

// ---------------------------------------------------------------- the save
export type ParatySave = { visited: boolean; stamps: string[] };
const K = 'poopyworld.paraty.v1';
export function loadParaty(): ParatySave {
  const empty: ParatySave = { visited: false, stamps: [] };
  try { return { ...empty, ...JSON.parse(localStorage.getItem(K) ?? '{}') }; } catch { return empty; }
}
export function saveParaty(p: ParatySave) {
  try { localStorage.setItem(K, JSON.stringify(p)); } catch { /* fine */ }
}

export const STAMPS: Array<{ id: string; name: string; short: string; icon: string }> = [
  { id: 'igreja', name: 'Igreja de Santa Rita', short: 'Kerk', icon: '⛪' },
  { id: 'tobogã', name: 'Cachoeira do Tobogã', short: 'Glijbaan', icon: '💦' },
  { id: 'escuna', name: 'Passeio de escuna', short: 'Boottocht', icon: '⛵' },
  { id: 'periquitos', name: 'De parkietjes', short: 'Parkietjes', icon: '🦜' },
];

/** The tide: 0 = low, 1 = high. One cycle is about 12 hours 25 minutes. */
export function tide(now = Date.now()) {
  const forced = new URLSearchParams(location.search).get('tide');
  if (forced) return Number(forced);
  return 0.5 + 0.5 * Math.sin((now / 3600000 / 12.42) * Math.PI * 2);
}

// ---------------------------------------------------------------- talk
export const WELCOME = [
  'BEM-VINDOS A PARATY',
  'Een oud koloniaal stadje tussen de bergen en de zee. Hier komt de familie vandaan.',
  'Tip: haal een stempelkaart! Bezoek de kerk, de waterglijbaan, maak een boottocht en zoek de parkietjes.',
];

export const CHURCH = [
  'De Igreja de Santa Rita, wit met blauw, vlak aan het water. Al bijna driehonderd jaar oud.',
  'Op bijna elke foto van Paraty staat deze kerk. Nu sta jij er ook op.',
];

export const SLIDE = {
  ask: ['De Cachoeira do Tobogã: een gladde rots waar het water vanaf glijdt, net een glijbaan.', 'De kinderen uit Paraty glijden er staand vanaf. Jij gaat zitten. Verstandig.'],
  after: ['WOEHOEEE! PLONS!', 'Je komt proestend boven in het koele water. Nog een keer? Natuurlijk nog een keer.'],
};

export const CAPTAIN = {
  ask: ['Seu Zé, kapitein van de schoener:', '"Passeio de escuna? Langs de eilandjes, de stranden, misschien zien we dolfijnen. Vamos!"'],
  after: ['"Gostou? Vond je het mooi?"', '"Er zijn meer dan zestig eilandjes in deze baai. Eén voor elke dag dat je hier blijft."'],
};

export const PARAKEETS = [
  'Een zwerm kleine groene parkietjes kwettert in de grote boom op het plein.',
  'Ze zijn groen met een beetje geel. Net als Kroki.',
  'Eentje kijkt je aan met zijn kopje scheef. Kroki zou zich hier helemaal thuis voelen.',
];

export const LURDES = {
  first: [
    'Dona Lurdes, achter een kraampje vol zoetigheid:',
    '"Oi, querida! Cocada? Paçoca? Doce de leite? Alles zelfgemaakt."',
    '"Ken je Gilly? Iedereen in Paraty kent Gilly. Je hoort haar van drie straten ver."',
  ],
  more: [
    ['"Neem nog een cocada. Je bent veel te mager. Dat zou Gilly ook zeggen."'],
    ['"Aardbeien? Hier? Nee, querida. Wij hebben kokos."'],
    ['"Bij vloed loopt de zee de straten in. Zo hebben ze Paraty gebouwd: de zee maakt de straten schoon."'],
  ],
};

export const TIDE_SIGN = (high: boolean) => high
  ? ['Het is vloed! De zee loopt de straten in, tussen de keien door.', 'Paraty is zo gebouwd: twee keer per dag spoelt de zee de straten schoon.']
  : ['Het is eb. Maar twee keer per dag komt de zee de straten in, tussen de keien door.', 'Kom later terug, dan zie je het.'];

export const LOCALS: Array<{ name: string; lines: string[] }> = [
  { name: 'Pescador', lines: ['"Bom dia! De vis bijt vandaag. Of morgen. Of overmorgen. Het is Paraty, geen haast."'] },
  { name: 'Turista', lines: ['"Ik ben hier al twee uur foto\'s aan het maken van deuren. Elke deur is een andere kleur!"'] },
  { name: 'Menino', lines: ['"Kun jij staand van de Tobogã? Ik wel. Mijn opa ook. Mijn oma ook!"'] },
];
