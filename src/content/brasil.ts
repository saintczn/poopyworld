/**
 * Brazil: Copacabana beach in Rio, with Gilly, Yara and Ben.
 * Quest "A Família na Praia": Gilly wants a family photo at Posto 5.
 */
export const MAP_W = 52;
export const MAP_H = 32;
export const SEA = 24;

export const BUILDINGS: Array<[string, number]> = [
  ['br-facade-a', 1], ['br-facade-b', 7.4], ['br-facade-c', 13.8], ['br-facade-d', 20.2], ['br-facade-e', 26.6], ['br-facade-a', 33.0],
];
export const sugarloaf = { x: 46.4, y: 7.9 };   // foot of the rock (behind the city)
export const kiosk = { x: 12, y: 17.2 };
export const acai = { x: 20, y: 16.6 };
export const posto = { x: 29, y: 19.6 };
export const goal = { x: 38, y: 15.4 };
export const taxi = { x: 2.2, y: 10.2 };
export const ben = { x: 23.6, y: 21.2 };

export const palms: Array<[string, number, number]> = [
  ['bali-palm-a', 3.4, 14.2], ['bali-palm-c', 9.0, 14.0], ['bali-palm-b', 16.4, 14.2], ['bali-palm-a', 25.0, 14.0],
  ['bali-palm-c', 32.4, 14.2], ['bali-palm-b', 41.0, 14.6], ['bali-palm-a', 49.6, 19.8],
];
/** Toucans sit in these palms (index into palms). */
export const toucanPalms = [1, 3, 5];

export const parasols: Array<{ x: number; y: number; tint: number }> = [
  { x: 5.6, y: 20.4, tint: 0xfff1a0 }, { x: 16.4, y: 21.4, tint: 0xa0e8ff }, { x: 23.6, y: 20.4, tint: 0xffb0d0 },
  { x: 33.4, y: 21.0, tint: 0xc8ffa0 }, { x: 43.0, y: 21.6, tint: 0xfff1a0 },
];

// ---------------------------------------------------------------- the save
export type BrasilSave = { visited: boolean; started: boolean; coconut: boolean; ben: boolean; yara: boolean; photo: boolean; penaltyWins?: number; penaltyGames?: number };
const K = 'poopyworld.brasil.v1';
export function loadBrasil(): BrasilSave {
  const empty: BrasilSave = { visited: false, started: false, coconut: false, ben: false, yara: false, photo: false };
  try { return { ...empty, ...JSON.parse(localStorage.getItem(K) ?? '{}') }; } catch { return empty; }
}
export function saveBrasil(b: BrasilSave) {
  try { localStorage.setItem(K, JSON.stringify(b)); } catch { /* fine */ }
}

// ---------------------------------------------------------------- talk
export const GILLY = {
  start: (name: string) => [
    `OI! ${name}! Bem-vindo, bem-vinda, welkom in Brazilië!`,
    'Ik heb pão de queijo gemaakt. Veertig stuks. Voor de zekerheid.',
    'Luister. Ik wil een FAMILIEFOTO. Hier, bij Posto 5. Met iedereen erop.',
    'Maar Ben ligt te slapen onder zijn parasol, en Yara wil pas meedoen als iemand haar verslaat met penalty\'s.',
    'Haal een ijskoud kokoswater bij de kiosk voor Ben, en speel tegen Yara. Dan maken we de foto! Vai, vai!',
  ],
  waiting: (left: string[]) => [`Nog niet iedereen is er! ${left.join(' en ')}.`, 'KALABOKA, Gilly, je praat te veel. ...Ga maar, ga maar.'],
  ready: ['IEDEREEN ER? Ben wakker? Yara klaar met opscheppen?', 'Naar Posto 5! Vamos! Zeg allemaal: XIS!'],
  after: [
    ['Die foto ga ik aan iedereen laten zien. Iedereen. Ook aan mijn vissen.'],
    ['Wil je een brigadeiro? Ik heb er honderd. Of honderdtwintig. Wie telt er nou brigadeiros?', 'Ik niet. Ik eet ze gewoon.'],
    ['Hier in Brazilië zeggen ze "cala a boca". Ik zeg kalaboka. Dat is hetzelfde, maar dan met liefde.'],
    ['Weet je wat lekker is? M&M\'s op het strand. Ze smelten wel. Dan eet je ze gewoon sneller.'],
  ],
};

export const YARA = {
  intro: [
    'Ah, daar ben je eindelijk. Je bent laat.',
    'Ik sta in het doel. Jij schiet vijf penalty\'s, ik schiet er vijf. Ik win. Zo werkt het.',
    'Klaar? Je bent niet klaar. Maar we beginnen toch.',
  ],
  again: ['Nog een keer? Prima. Ik ga je weer inmaken.', 'Of je wint per ongeluk. Dat telt dan niet.'],
  won: ['Je had geluk. Dat was wind. Er stond heel duidelijk wind.', 'Oké, ik doe mee met de foto. Maar ik sta in het midden.'],
  lost: ['Zie je? Ik zei het toch. Ik win altijd.', 'Ik doe wel mee met die foto hoor. Iemand moet hem goed laten lijken.'],
  draw: ['Gelijkspel. Dat betekent dus dat ik gewonnen heb.', 'Kom, mama wil een foto.'],
  after: [
    ['Je staat verkeerd. Nee, nog steeds verkeerd. Laat maar.'],
    ['Ik heb mama net uitgelegd hoe ze haar zonnebrand moet smeren. Ze luisterde niet.'],
    ['Nog een potje penalty\'s? Ik sta te popelen.'],
  ],
};

export const BEN = {
  asleep: ['Zzz...', 'Ben slaapt onder zijn parasol, met een krant over zijn buik.', 'Misschien wordt hij wakker van iets kouds.'],
  wake: ['Je houdt een ijskoud kokoswater tegen Bens arm.', '...', '...hm.', 'Hij gaat rechtop zitten, neemt een slok, en knikt.', 'Dat is Ben voor: "Dank je, ik kom eraan."'],
  awake: [['hm.'], ['Ben kijkt naar de zee.', '...mooi.', 'Dat was een hele toespraak voor Ben.'], ['Ben wijst naar de Suikerbroodberg.', '...hoog.']],
};

export const KIOSK = {
  menu: ['QUIOSQUE', 'Água de coco (kokoswater) — ijskoud', 'Pão de queijo — warm, van Gilly', 'Brigadeiros — van Gilly, honderd stuks', 'Caipirinha met aardbei — NÃO. Nunca.'],
  coconut: ['"Um coco gelado, por favor!"', 'Je krijgt een ijskoude kokosnoot met een rietje. Die is voor Ben.'],
};

export const ACAI = ['Açaí na tigela: koude paarse açaí met banaan, granola en honing.', 'Je eet het veel te snel. Brainfreeze. Totally worth it.'];

export const PHOTO_KEY = 'poopyworld.photo.v1';
