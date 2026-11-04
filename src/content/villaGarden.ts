/**
 * Content for the villa garden (milestone 1).
 * This file only describes WHAT is in the garden and WHERE.
 * Positions are in tiles (32x32 px). Decimal tiles are fine for objects.
 * For objects, (x, y) is the point where the object touches the ground (its "feet").
 */

export const MAP_W = 36;
export const MAP_H = 26;

type Rect = { x: number; y: number; w: number; h: number };

/** Dirt paths and the front yard (everything else is grass). */
export const dirt: Rect[] = [
  { x: 12, y: 8, w: 12, h: 2 },   // front yard
  { x: 16, y: 10, w: 2, h: 16 },  // main path down to the road
  { x: 9, y: 15, w: 7, h: 2 },    // to the pond
  { x: 10, y: 17, w: 2, h: 4 },   // down to the vegetable patch
  { x: 18, y: 14, w: 8, h: 2 },   // to the goat meadow
  { x: 8, y: 5, w: 4, h: 3 },     // outdoor dining corner
  { x: 11, y: 7, w: 1, h: 1 },
];

/** The pond (tiles, including its grassy banks). */
export const pond: Rect = { x: 3, y: 12, w: 6, h: 6 };

/** Vegetable patch (tilled soil). */
export const soil: Rect = { x: 4, y: 19, w: 6, h: 4 };

/** Goat meadow fence (tiles). The opening is on the left side. */
export const goatPen = { x: 26, y: 11, w: 8, h: 9, openingY: 14, openingH: 2 };

/** Garden fence along the bottom, with a gate gap for the road to Heartwood. */
export const bottomFence = { y: 24, gapX: 16, gapW: 2 };

/** The house: top-left corner in pixels. */
export const house = { x: 432, y: 34 };

export type Prop = { key: string; x: number; y: number; solid?: [w: number, h: number]; flip?: boolean; anim?: string };

export const trees: Array<[key: string, x: number, y: number]> = [
  // back forest (top)
  ['tree-b', 1.2, 2.2], ['tree-a', 3.6, 1.6], ['pine-b', 5.8, 2.4], ['tree-c', 8.2, 1.8], ['tree-a', 10.6, 2.6],
  ['pine-a', 12.6, 1.4], ['tree-b', 26.6, 2.0], ['tree-a', 26.8, 2.8], ['pine-b', 29.0, 1.8], ['tree-c', 31.2, 2.4],
  ['tree-a', 33.4, 1.6], ['pine-a', 35.2, 2.6], ['tree-d', 22.4, 1.0], ['tree-e', 6.8, 0.6], ['tree-d', 27.8, 0.6],
  // left edge
  ['tree-e', 0.6, 5.0], ['pine-c', 1.2, 8.2], ['tree-d', 0.4, 11.2], ['tree-a', 1.0, 14.6], ['pine-b', 0.6, 18.0],
  ['tree-b', 1.0, 21.4], ['tree-e', 0.6, 24.8],
  // right edge
  ['pine-a', 35.0, 5.4], ['tree-d', 35.4, 8.8], ['tree-a', 35.0, 12.4], ['pine-c', 35.4, 16.0], ['tree-b', 35.0, 19.6],
  ['tree-e', 35.4, 23.0],
  // bottom edge (in front of the fence)
  ['tree-a', 3.0, 26.4], ['pine-b', 6.4, 26.6], ['tree-d', 9.6, 26.2], ['tree-b', 12.8, 26.6],
  ['tree-e', 21.6, 26.4], ['pine-a', 24.8, 26.6], ['tree-a', 28.0, 26.2], ['tree-d', 31.4, 26.6],
  // inside the garden
  ['tree-a', 13.4, 20.6], ['tree-b', 22.6, 21.2], ['pine-c', 28.6, 22.4], ['tree-c', 29.4, 7.0], ['tree-a', 31.6, 7.8],
  ['tree-e', 6.2, 10.4],
];

export const props: Prop[] = [
  // outdoor dining corner
  { key: 'table', x: 10.0, y: 6.9, solid: [72, 14] },
  { key: 'stool', x: 8.7, y: 7.0, solid: [16, 8] },
  { key: 'stool', x: 11.3, y: 7.0, solid: [16, 8] },
  { key: 'fire-0', x: 8.6, y: 5.6, solid: [24, 10], anim: 'fire' },
  { key: 'barrels', x: 12.4, y: 5.4, solid: [40, 14] },
  { key: 'lamp', x: 7.6, y: 7.9, solid: [10, 6] },
  // front of the house
  { key: 'planter-tree', x: 15.3, y: 7.9, solid: [22, 10] },
  { key: 'planter-tree', x: 18.7, y: 7.9, solid: [22, 10] },
  { key: 'pot-flowers', x: 20.7, y: 7.85 },
  { key: 'planter-tree', x: 22.7, y: 7.9, solid: [22, 10] },
  { key: 'pot-flowers', x: 21.7, y: 7.85 },
  { key: 'pot-flowers', x: 13.2, y: 7.85 },
  { key: 'crates', x: 26.6, y: 8.4, solid: [56, 14] },
  { key: 'bucket', x: 27.9, y: 8.8 },
  // lamps along the path
  { key: 'lamp', x: 15.6, y: 12.6, solid: [10, 6] },
  { key: 'lamp', x: 18.4, y: 12.6, solid: [10, 6] },
  { key: 'lamp', x: 15.6, y: 20.6, solid: [10, 6] },
  { key: 'lamp', x: 18.4, y: 20.6, solid: [10, 6] },
  // goat meadow
  { key: 'hay-gold', x: 31.8, y: 14.6, solid: [50, 22] },
  { key: 'trough-water', x: 28.8, y: 13.0, solid: [58, 14] },
  { key: 'trough-hay', x: 30.6, y: 18.2, solid: [58, 14] },
  { key: 'bucket', x: 27.6, y: 18.4 },
  { key: 'barrel', x: 32.6, y: 18.4, solid: [22, 10] },
  // vegetable patch extras
  { key: 'basket', x: 10.6, y: 22.6 },
  { key: 'barrel', x: 3.4, y: 23.2, solid: [22, 10] },
  // rocks & bits
  { key: 'rock-big', x: 24.0, y: 18.2, solid: [44, 16] },
  { key: 'rock-mid', x: 25.0, y: 18.6 },
  { key: 'rock-small', x: 7.4, y: 18.7 },
  { key: 'rock-mid', x: 31.6, y: 22.0 },
  { key: 'fern', x: 2.6, y: 11.6 },
  { key: 'fern', x: 21.0, y: 4.2 },
  { key: 'cypress-a', x: 14.0, y: 4.6, solid: [16, 8] },
  { key: 'cypress-b', x: 25.0, y: 4.6, solid: [16, 8] },
];

/** Flower bushes and small plants (no collision). [key, x, y] */
export const flowers: Array<[string, number, number]> = [
  // along the front of the house
  ['flowers-big-1', 13.9, 8.0], ['flowers-mid-5', 14.5, 8.05], ['flowers-big-0', 19.5, 8.0], ['flowers-mid-1', 20.1, 8.05],
  ['flowers-big-6', 23.0, 8.0], ['flowers-mid-3', 21.2, 8.05], ['flowers-big-1', 22.2, 8.0],
  // along the main path
  ['flowers-mid-3', 15.4, 11.4], ['flowers-small-5', 15.5, 13.8], ['flowers-mid-0', 18.6, 11.4], ['flowers-small-1', 18.5, 13.6],
  ['flowers-small-3', 15.5, 17.6], ['flowers-small-6', 18.5, 18.4], ['flowers-mid-5', 15.4, 22.6], ['flowers-mid-1', 18.6, 22.8],
  // around the pond
  ['flowers-big-8', 3.0, 11.4], ['flowers-mid-3', 8.8, 12.0], ['flowers-small-0', 9.0, 17.8], ['flowers-big-4', 2.4, 17.0],
  // bushes
  ['bush-a', 12.6, 11.2], ['bush-b', 21.4, 11.4], ['bush-a', 25.0, 12.0], ['bush-b', 6.0, 23.8], ['bush-a', 12.4, 23.6],
  ['bush-b', 20.6, 23.4], ['bush-a', 25.2, 23.8], ['bush-a', 2.4, 15.4],
  // wild corners
  ['flowers-big-2', 21.2, 17.8], ['flowers-mid-7', 13.4, 16.0], ['flowers-big-5', 30.6, 21.4], ['flowers-mid-8', 33.2, 21.0],
  ['tall-grass-c', 2.2, 20.6], ['tall-grass-a', 12.0, 13.6], ['tall-grass-b', 22.8, 12.8], ['tall-grass-c', 33.4, 10.0],
  ['tall-grass-a', 28.4, 10.2], ['tall-grass-b', 9.8, 10.6], ['tall-grass-a', 26.0, 22.6],
];

/** Things on the pond (no collision). */
export const pondDecor: Array<[string, number, number]> = [
  ['lily-a', 5.0, 14.2], ['lily-b', 6.6, 15.6], ['lily-c', 4.4, 16.4], ['reeds-a', 7.6, 13.4], ['reeds-b', 4.0, 13.6],
];

/** Crops on the vegetable patch. */
export const crops: Array<[string, number, number]> = [
  ['leafy-a', 5.5, 20.5], ['leafy-a', 6.5, 20.5], ['leafy-b', 7.5, 20.5], ['leafy-b', 8.5, 20.5],
  ['leafy-c', 5.5, 21.6], ['leafy-d', 6.5, 21.6], ['leafy-c', 7.5, 21.6],
];

import type { Interactable } from '../scenes/WorldScene';

/** The top of the front stairs: walking up past this point goes inside. */
export const doorway = { x: 512, y: 240 };

export const interactables: Interactable[] = [
  {
    id: 'door', at: { x: 512, y: 240 }, who: 'Naar binnen', lines: [],
  },
  { id: 'flag-ng', at: { x: 400, y: 288 }, who: 'Nigeriaanse vlag', lines: ['Groen, wit, groen. De Nigeriaanse vlag wappert trots naast het pad.'] },
  { id: 'flag-nl', at: { x: 758, y: 288 }, who: 'Nederlandse vlag', lines: ['Rood, wit, blauw. De Nederlandse vlag wappert aan de andere kant.'] },
  {
    id: 'mailbox', at: { x: 600, y: 300 }, who: 'Brievenbus',
    lines: ['De brievenbus is leeg.', 'Nog wel. Hier komen straks brieven en verrassingen van elkaar in.'],
  },
  {
    id: 'kroki', at: { x: 854, y: 210 }, who: "Kroki's plekje",
    lines: ['Een houten zitstok met een bakje zaad en een schommeltje.', 'Dit is het plekje van Kroki. Hier komt Kroki straks te wonen.'],
  },
  { id: 'dining', at: { x: 320, y: 235 }, who: 'Buitenkeuken', lines: ['Een tafel, een kampvuur en een paar tonnen. Hier wordt later gekookt en gegeten.'] },
  {
    id: 'pond', at: { x: 290, y: 495 }, who: 'Vijver',
    lines: ['Een rustige vijver met waterlelies. Je ziet iets glinsteren onder water.', 'Vissen kan nog niet. Er moet eerst een hengel komen.'],
  },
  { id: 'veggies', at: { x: 336, y: 690 }, who: 'Moestuin', lines: ['Sla en kool, bijna klaar om te oogsten. Aardbeien groeien hier natuurlijk NIET.'] },
  {
    id: 'goats', at: { x: 812, y: 470 }, who: 'Geitenwei',
    lines: ['De geitenwei van Sneeuwvlokje, Karamel en Drop.', 'Volgens de geruchten oefenen ze al op ontsnappen.'],
  },
  {
    id: 'gate', at: { x: 544, y: 790 }, who: 'Weg naar Heartwood',
    lines: ['Deze weg loopt naar Heartwood Village.', 'Er wordt nog aan gewerkt. Binnenkort kun je hier verder.'],
  },
];

/** Handmade pieces (flags, mailbox, perch, signs), position in tiles. */
export const handmade: Array<{ key: string; x: number; y: number; solid?: [number, number]; anim?: string }> = [
  { key: 'flag-ng', x: 12.5, y: 9.1, solid: [8, 6], anim: 'wave-ng' },
  { key: 'flag-nl', x: 23.6, y: 9.1, solid: [8, 6], anim: 'wave-nl' },
  { key: 'mailbox', x: 18.8, y: 9.6, solid: [14, 6] },
  { key: 'perch', x: 26.8, y: 6.6, solid: [30, 8] },
  { key: 'sign', x: 25.4, y: 13.6, solid: [10, 6] },
  { key: 'sign', x: 18.8, y: 24.6, solid: [10, 6] },
];

/** Where the player starts (pixels). */
export const spawn = { x: 544, y: 290 };
