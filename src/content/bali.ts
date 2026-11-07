/**
 * Bali: the beach with Warung Bitterbal and Casa Umalas, the villa from the holiday.
 * Positions in tiles (32 px). Quest: "Het geheime recept" for Bram of the warung.
 */
import type { Look } from '../characters/look';

export const MAP_W = 50;
export const MAP_H = 34;
export const SEA = 25; // row where the water starts

type Rect = { x: number; y: number; w: number; h: number };

/** Sand (no grass): the beach and the warung square. */
export const sand: Rect[] = [
  { x: 0, y: 17, w: MAP_W, h: MAP_H - 17 },
  { x: 27, y: 11, w: 15, h: 6 },
];
/** Darker sand paths. */
export const paths: Rect[] = [
  { x: 0, y: 15, w: 28, h: 2 },   // from the taxi stand to the warung
  { x: 11, y: 8, w: 2, h: 7 },    // through the gate up to Casa Umalas
  { x: 22, y: 17, w: 4, h: 7 },   // down to the pier
];

export const casa = { x: 6.75, y: 1 };   // top-left of the villa (door at x = 12)
export const pool = { x: 13.4, y: 9.2 }; // top-left of the pool with its deck
export const gate = { x: 12, y: 14.6 };  // feet of the split gate
export const warung = { x: 30, y: 6.5 }; // top-left of the warung
export const pier = { x: 24, y: 23.4 };  // top centre of the pier
export const taxi = { x: 2.6, y: 14.6 };

export const palms: Array<[string, number, number]> = [
  // along the top edge (jungle)
  ['bali-palm-c', 1.4, 3.2], ['bali-palm-a', 3.6, 6.4], ['bali-palm-b', 1.2, 10.2], ['bali-palm-a', 20.6, 3.0], ['bali-palm-c', 23.0, 6.2],
  ['bali-palm-b', 25.6, 3.6], ['bali-palm-a', 27.6, 7.6], ['bali-palm-c', 43.6, 3.4], ['bali-palm-b', 46.4, 6.4], ['bali-palm-a', 48.6, 3.0],
  ['bali-palm-c', 45.0, 10.4], ['bali-palm-b', 48.4, 13.2],
  // along the beach
  ['bali-palm-a', 3.0, 19.8], ['bali-palm-c', 14.2, 17.6], ['bali-palm-b', 19.4, 18.4], ['bali-palm-a', 28.4, 18.2],
  ['bali-palm-c', 33.4, 17.8], ['bali-palm-b', 41.6, 18.2], ['bali-palm-a', 47.0, 17.8],
];

export const bushes: Array<[string, number, number]> = [
  ['fern', 2.4, 8.0], ['leafy-a', 21.4, 8.4], ['leafy-b', 24.4, 9.8], ['fern', 26.2, 12.4], ['leafy-c', 43.0, 8.4], ['fern', 46.6, 15.0],
  ['bali-frangipani', 6.0, 13.8], ['bali-frangipani', 18.4, 7.6], ['bali-frangipani', 42.4, 12.6], ['bali-frangipani', 8.2, 8.8],
  ['flowers-big-1', 9.6, 14.0], ['flowers-big-6', 14.6, 14.0], ['flowers-mid-5', 22.6, 14.0], ['flowers-big-2', 26.6, 9.4],
  ['tall-grass-c', 0.8, 13.0], ['tall-grass-a', 44.6, 16.2],
];

/** Parasol + sun bed pairs and other beach things. */
export const beach: Array<{ key: string; x: number; y: number; solid?: [number, number] }> = [
  { key: 'bali-parasol', x: 7.0, y: 20.6, solid: [6, 4] }, { key: 'bali-sunbed', x: 7.8, y: 21.1, solid: [44, 8] },
  { key: 'bali-parasol', x: 12.4, y: 21.2, solid: [6, 4] }, { key: 'bali-sunbed', x: 13.2, y: 21.7, solid: [44, 8] },
  { key: 'bali-parasol', x: 17.0, y: 20.4, solid: [6, 4] }, { key: 'bali-sunbed', x: 17.6, y: 20.9, solid: [44, 8] },
  { key: 'bali-surf-a', x: 20.4, y: 19.4, solid: [10, 4] }, { key: 'bali-surf-b', x: 20.9, y: 19.6, solid: [10, 4] },
  { key: 'bali-canang', x: 11.0, y: 14.9 }, { key: 'bali-canang', x: 13.0, y: 14.9 }, { key: 'bali-canang', x: 33.6, y: 12.5 },
  { key: 'rock-big', x: 2.4, y: 23.4, solid: [50, 18] }, { key: 'rock-mid', x: 46.0, y: 22.6 },
];

export const torches: Array<[number, number]> = [[28.6, 12.8], [40.4, 12.8], [10.4, 15.0], [13.6, 15.0], [22.0, 22.6], [26.0, 22.6], [36.0, 19.0]];
export const boats: Array<[number, number, boolean]> = [[36.0, 25.6, false], [43.0, 26.2, true]];

// ---------------------------------------------------------------- the quest
export type BaliSave = { visited: boolean; started: boolean; found: string[]; done: boolean; turtles?: number; coconuts?: number; monkeyAttacks?: number };
const K = 'poopyworld.bali.v1';
export function loadBali(): BaliSave {
  const empty: BaliSave = { visited: false, started: false, found: [], done: false };
  try { return { ...empty, ...JSON.parse(localStorage.getItem(K) ?? '{}') }; } catch { return empty; }
}
export function saveBali(b: BaliSave) {
  try { localStorage.setItem(K, JSON.stringify(b)); } catch { /* fine */ }
}

export const BRAM_LOOK: Look = {
  body: 'm', skin: 'Tan', eyes: 'Blue', hair: 'cowlick', hairColor: 'Blonde', beard: 'trimmed',
  shirt: 'buttoned', shirtColor: 'Orange', legs: 'shorts', legsColor: 'Tan', shoes: 'shoes', shoesColor: 'Brown',
} as Look;

export const ITEMS: Array<{ id: string; tex: string; x: number; y: number; name: string; found: string }> = [
  { id: 'mustard', tex: 'mustard', x: 36.6, y: 24.3, name: 'Mosterdpot', found: 'Bram\'s mosterdpot! Hij lag naast de bootjes, half in het zand. Er zit nog een aapje-pootafdruk op.' },
  { id: 'basket', tex: 'bali-basket', x: 46.2, y: 12.2, name: 'Frituurmandje', found: 'Het frituurmandje hangt in de struiken. Het ruikt nog steeds naar bitterballen.' },
  { id: 'recipe', tex: 'journal', x: 16.8, y: 13.2, name: 'Receptkaart', found: 'De geheime receptkaart ligt naast het zwembad van Casa Umalas. Het aapje had smaak.' },
];

export const BRAM = {
  hello: [
    'Selamat datang! Ik ben Bram, uit Zaandam. Dit is Warung Bitterbal: de enige plek op Bali met echte Hollandse bitterballen.',
    'Maar vandaag gaat alles mis. Een aap is mijn warung binnengeslopen en heeft er met mijn spullen vandoor gegaan.',
    'Mijn mosterdpot, mijn frituurmandje en mijn GEHEIME receptkaart. Zonder die drie geen bitterballen.',
    'Kunnen jullie ze voor me zoeken? Ze moeten ergens hier op het eiland liggen. Kijk op de kaart (M) als je de weg kwijt bent.',
  ],
  busy: (left: number) => [`Nog ${left} ${left === 1 ? 'ding' : 'dingen'} te gaan. Dat aapje kan overal zijn geweest: het strand, de struiken, zelfs Casa Umalas.`],
  done: [
    'Alles terug! Mosterd, mandje en het recept. Jullie zijn helden.',
    'Even wachten... *sssss* ...',
    'Alsjeblieft: de Bitterbal Sambal Special. Bitterballen met een likje Balinese sambal. Een uitvinding van jullie, eigenlijk.',
    'Vanaf nu eten jullie hier altijd gratis. Zeg het niet tegen de aap.',
  ],
  after: [
    ['Nog een portie? Ze zijn net uit het vet.', 'O, en voor de duidelijkheid: aardbeiensambal bestaat niet. Gaat ook nooit bestaan.'],
    ['Wist je dat het hier op Bali altijd een paar uur later is dan thuis? Kijk maar naar de lucht.'],
    ['Ik hoorde van Femke dat jullie haar verslagen hebben bij Bitterbal Rush. Ze is er nog steeds boos over.'],
    ['Pas op voor dat aapje bij het strand. Hij valt alleen mensen aan die hij leuk vindt. Zegt hij.'],
  ],
};

export const CASA_LINES = [
  'Casa Umalas. Jullie villa van de vakantie.',
  'De deuren staan open, de ventilator draait en binnen ruikt het naar zonnebrand en kokos.',
  'Hier zou je zo weer twee weken kunnen blijven.',
];

export const hatchery = { x: 29.2, y: 21.6 };      // feet of the turtle nursery
export const monkeyHome = { x: 9, y: 18.4 };

export const TURTLE_LINES = [
  ['Een zeeschildpad sjokt langzaam over het zand.', 'Ze kijkt je even aan, knippert heel traag, en sjokt verder. Geen haast. Nooit haast.'],
  ['De schildpad heeft zand op haar neus.', 'Ze vindt het prima zo.'],
  ['Zeeschildpadden komen altijd terug naar het strand waar ze zelf geboren zijn.', 'Net als jullie naar Bali, eigenlijk.'],
  ['Je mag haar niet aanraken, maar je mag wel heel zachtjes "hoi" zeggen.', '"Hoi."', 'Ze zegt niks terug. Maar ze vond het fijn, dat zag je.'],
];

export const HATCHERY = {
  first: [
    'Een schildpaddenopvang. Hier worden eieren van zeeschildpadden veilig bewaard tot ze uitkomen.',
    'Er zijn net zes kleintjes uit het ei gekropen! Ze moeten zelf naar zee lopen, dan onthouden ze dit strand voor altijd.',
    'Jullie mogen helpen: hou de meeuwen weg en moedig ze aan. Daar gaan ze!',
  ],
  again: ['Er zijn weer nieuwe kleintjes uitgekomen! Daar gaan ze, wiebelend naar zee.'],
};

export const MONKEY = {
  attack: [
    ['HÉ! Het aapje stormt krijsend op je af!', 'Je rent gillend over het strand. Het aapje heeft de tijd van zijn leven.', 'Iemand die dit zag ligt nu in een deuk.'],
    ['NEE NEE NEE. Daar is hij weer!', 'Het aapje springt, grijpt naar je haar en rent er weer vandoor. Missie geslaagd, voor hem dan.'],
    ['Het aapje valt opnieuw aan!', 'Je probeert stoer te kijken. Het aapje is niet onder de indruk.'],
    ['Weer die aap. Hij heeft jou echt uitgekozen.', 'Misschien is het liefde. Misschien is het oorlog.'],
  ],
  calm: [
    ['Het aapje zit rustig in het zand en kijkt de andere kant op.', 'Alsof er helemaal niks gebeurd is.'],
    ['Het aapje peutert in zijn oor en kijkt je dan heel lang aan.', 'Je loopt maar beter niet te dichtbij.'],
    ['Het aapje heeft een zonnebril op zijn hoofd. Van wie die is weet niemand.'],
  ],
};

