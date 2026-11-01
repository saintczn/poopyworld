/**
 * Content for the villa garden (milestone 1).
 * This file only describes WHAT is in the garden and WHERE.
 * The game systems read it; no game logic lives here.
 * Coordinates are in tiles (16x16 px) unless noted.
 */

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;

/** Ground types. */
export enum Ground {
  Grass = 0,
  Path = 1,
  Water = 2,
  Soil = 3,
  Flowers = 4,
}

type Rect = { x: number; y: number; w: number; h: number };

/** Ground areas, painted in this order on top of grass. */
export const groundAreas: Array<Rect & { type: Ground }> = [
  // Terrace in front of the villa, plus the branch to the dining corner
  { x: 7, y: 11, w: 20, h: 1, type: Ground.Path },
  { x: 7, y: 9, w: 3, h: 2, type: Ground.Path },
  // Main path from the front door down to the gate (to Heartwood)
  { x: 19, y: 11, w: 2, h: 19, type: Ground.Path },
  // Branch to the pond (left)
  { x: 11, y: 16, w: 8, h: 2, type: Ground.Path },
  // Branch to the goat meadow (right)
  { x: 21, y: 17, w: 7, h: 2, type: Ground.Path },
  // Pond
  { x: 4, y: 14, w: 7, h: 6, type: Ground.Water },
  // Vegetable patch
  { x: 4, y: 22, w: 7, h: 5, type: Ground.Soil },
  // Flower beds either side of the terrace
  { x: 15, y: 12, w: 3, h: 2, type: Ground.Flowers },
  { x: 23, y: 12, w: 3, h: 2, type: Ground.Flowers },
];

/** Pond corners stay grass so the pond looks round. */
export const groundExceptions: Array<{ x: number; y: number; type: Ground }> = [
  { x: 4, y: 14, type: Ground.Grass },
  { x: 10, y: 14, type: Ground.Grass },
  { x: 4, y: 19, type: Ground.Grass },
  { x: 10, y: 19, type: Ground.Grass },
];

/** Gap in the bottom fence: the road to Heartwood Village (closed for now). */
export const gate = { x: 19, w: 2 };

/** The goat meadow fence, with an opening on the left side. */
export const goatPen = { x: 28, y: 14, w: 9, h: 8, openingY: 17, openingH: 2 };

export const trees: Array<[number, number]> = [
  // top edge
  [2, 1], [5, 1], [8, 1], [11, 1], [29, 1], [32, 1], [35, 1], [37, 2],
  // left edge
  [1, 5], [1, 9], [2, 13], [1, 20], [2, 26],
  // right edge
  [38, 5], [38, 9], [38, 13], [38, 23], [37, 27],
  // bottom edge
  [5, 28], [9, 28], [13, 28], [26, 28], [30, 28], [34, 28],
  // inside the garden
  [13, 21], [26, 24], [15, 25], [30, 7],
];

export const bushes: Array<[number, number]> = [
  [12, 14], [26, 14], [16, 21], [23, 21], [31, 25], [35, 25], [12, 8], [3, 11],
];

/** Things you can look at. `at` is in pixels (the spot you walk up to). */
export type Interactable = {
  id: string;
  at: { x: number; y: number };
  who: string;
  lines: string[];
};

export const interactables: Interactable[] = [
  {
    id: 'door',
    at: { x: 320, y: 174 },
    who: 'De voordeur',
    lines: [
      'De voordeur van jullie villa. Hij zit nog op slot.',
      'Binnen wordt nog verbouwd. In mijlpaal 3 mogen jullie naar binnen.',
    ],
  },
  {
    id: 'flag-ng',
    at: { x: 232, y: 194 },
    who: 'Nigeriaanse vlag',
    lines: ['Groen, wit, groen. De Nigeriaanse vlag wappert trots naast de voordeur.'],
  },
  {
    id: 'flag-nl',
    at: { x: 408, y: 194 },
    who: 'Nederlandse vlag',
    lines: ['Rood, wit, blauw. De Nederlandse vlag wappert aan de andere kant van de deur.'],
  },
  {
    id: 'mailbox',
    at: { x: 348, y: 218 },
    who: 'Brievenbus',
    lines: [
      'De brievenbus is leeg.',
      'Nog wel. Hier komen straks brieven en verrassingen van elkaar in.',
    ],
  },
  {
    id: 'kroki',
    at: { x: 456, y: 168 },
    who: "Kroki's plekje",
    lines: [
      "Een mooie houten zitstok met uitzicht over de hele tuin.",
      'Dit is het plekje van Kroki. Hier komt Kroki straks te wonen, met eigen speeltjes.',
    ],
  },
  {
    id: 'dining',
    at: { x: 128, y: 150 },
    who: 'Buitenkeuken',
    lines: ['Een tafel voor twee en een barbecue. Hier wordt later gekookt en gegeten.'],
  },
  {
    id: 'pond',
    at: { x: 176, y: 272 },
    who: 'Vijver',
    lines: [
      'Een rustige vijver. Je ziet iets glinsteren onder water.',
      'Vissen kan nog niet. Er moet eerst een hengel komen.',
    ],
  },
  {
    id: 'veggies',
    at: { x: 120, y: 344 },
    who: 'Moestuin',
    lines: ['Verse aarde, klaar om te zaaien. Aardbeien komen hier natuurlijk NIET.'],
  },
  {
    id: 'goats',
    at: { x: 444, y: 286 },
    who: 'Geitenwei',
    lines: [
      'Een lege wei met een schuurtje.',
      'Hier komen straks de geiten. Volgens de geruchten zijn ze nu al aan het ontsnappen.',
    ],
  },
  {
    id: 'gate',
    at: { x: 320, y: 456 },
    who: 'Weg naar Heartwood',
    lines: ['Deze weg loopt naar Heartwood Village.', 'Er wordt nog aan gewerkt. Binnenkort kun je hier verder.'],
  },
];

/** Where each player starts (pixels). */
export const spawn = { x: 320, y: 232 };
