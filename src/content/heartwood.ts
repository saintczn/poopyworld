/**
 * Heartwood Village: the town square south of the villa garden.
 * Positions in tiles (32 px) unless noted.
 */
export const MAP_W = 44;
export const MAP_H = 30;

type Rect = { x: number; y: number; w: number; h: number };

export const dirt: Rect[] = [
  { x: 20, y: 0, w: 4, h: 10 },   // road from the villa
  { x: 10, y: 10, w: 24, h: 8 },  // the square
  { x: 10, y: 18, w: 3, h: 6 },   // west lane
  { x: 31, y: 18, w: 3, h: 6 },   // east lane
  { x: 4, y: 24, w: 36, h: 3 },   // lower street
];

export type Building = {
  id: string; sprite: string; x: number; y: number; // top-left in pixels
  sign: string; signColour: string; door: { x: number; y: number }; who: string; lines: string[];
  walls: Array<[number, number, number, number]>; windows: Array<[number, number]>;
};

const HOUSE_A_WALLS: Array<[number, number, number, number]> = [[32, 100, 128, 76], [32, 176, 32, 16], [96, 176, 64, 16], [160, 70, 64, 90], [22, 60, 10, 120]];
const HOUSE_A_WINDOWS: Array<[number, number]> = [[128, 143], [192, 112]];
const COTTAGE_WALLS: Array<[number, number, number, number]> = [[0, 60, 100, 76], [96, 60, 64, 70]];
const HOUSE_B_WALLS: Array<[number, number, number, number]> = [[24, 120, 144, 72]];

export const buildings: Building[] = [
  {
    id: 'puck', sprite: 'house-purple', x: 360, y: 128, sign: 'PUCK', signColour: '#ff5fd2',
    door: { x: 440, y: 336 }, walls: HOUSE_A_WALLS, windows: HOUSE_A_WINDOWS, who: 'PUCK Arcade',
    lines: ['Binnen hoor je piepjes, muntjes en gejuich.', 'Hier komen straks de minigames: jullie twee plus twee dorpelingen. Goat Mayhem, Slippery Panic, Bitterbal Rush...', 'De deur gaat binnenkort open.'],
  },
  {
    id: 'cafe', sprite: 'cottage', x: 800, y: 160, sign: 'Café', signColour: '#ffd27a',
    door: { x: 928, y: 324 }, walls: COTTAGE_WALLS, windows: [[60, 100]], who: 'Café Heartwood',
    lines: ['Het ruikt naar koffie, appeltaart en... bitterballen?', 'De barista zwaait. "Binnenkort open! Kom dan zeker langs."'],
  },
  {
    id: 'shop', sprite: 'house-b', x: 1008, y: 128, sign: 'Winkel', signColour: '#a8e07a',
    door: { x: 1120, y: 328 }, walls: HOUSE_B_WALLS, windows: [[64, 150], [96, 75]], who: 'Algemene Winkel',
    lines: ['Zaden, gereedschap, meubels en snoep.', 'Straks kun je hier spullen kopen met munten die je verdient met vissen en minigames.'],
  },
  {
    id: 'post', sprite: 'house-blue', x: 112, y: 576, sign: 'Post', signColour: '#8fd0ff',
    door: { x: 192, y: 784 }, walls: HOUSE_A_WALLS, windows: HOUSE_A_WINDOWS, who: 'Postkantoor',
    lines: ['Een loket, een weegschaal en heel veel postzegels.', 'Hier gaan straks jullie brieven en pakketjes langs, op weg naar jullie brievenbus.'],
  },
  {
    id: 'museum', sprite: 'house-green', x: 600, y: 576, sign: 'Museum', signColour: '#f2e6c0',
    door: { x: 680, y: 784 }, walls: HOUSE_A_WALLS, windows: HOUSE_A_WINDOWS, who: 'Museum van Heartwood',
    lines: ['Lege vitrines met kleine bordjes ernaast.', 'Hier komen straks jullie vangsten en vondsten te staan. Er is al een plekje gereserveerd voor de regenboogkoi.'],
  },
  {
    id: 'fishshop', sprite: 'cottage-blue', x: 1056, y: 608, sign: 'Hengel & Haak', signColour: '#9be3ff',
    door: { x: 1184, y: 772 }, walls: COTTAGE_WALLS, windows: [[60, 100]], who: 'Hengel & Haak',
    lines: ['Hengels, aas en een opgezette vis aan de muur.', 'De visboer roept: "Al iets bijzonders gevangen in jullie vijver? Gerrit misschien?"'],
  },
];

export const props: Array<{ key: string; x: number; y: number; solid?: [number, number]; z?: number }> = [
  // market stall next to the fountain
  { key: 'table', x: 15.2, y: 15.0, solid: [74, 14] },
  { key: 'basket', x: 14.6, y: 14.55, z: 481 },
  { key: 'basket', x: 15.8, y: 14.55, z: 481 },
  { key: 'pot-flowers', x: 29.0, y: 14.55, z: 481 },
  { key: 'bush-a', x: 5.0, y: 12.0 }, { key: 'flowers-big-3', x: 6.2, y: 12.2 }, { key: 'tree-b', x: 5.4, y: 17.2, solid: [22, 10] },
  { key: 'flowers-big-7', x: 38.6, y: 12.4 }, { key: 'bush-b', x: 39.6, y: 16.4 }, { key: 'fern', x: 4.0, y: 20.0 },
  { key: 'crates', x: 13.0, y: 15.4, solid: [56, 14] },
  { key: 'barrel', x: 17.4, y: 15.2, solid: [22, 10] },
  // benches (tables) and lamps around the square
  { key: 'table', x: 29.0, y: 15.0, solid: [74, 14] },
  { key: 'lamp', x: 11.0, y: 11.2, solid: [10, 6] },
  { key: 'lamp', x: 33.0, y: 11.2, solid: [10, 6] },
  { key: 'lamp', x: 11.0, y: 17.6, solid: [10, 6] },
  { key: 'lamp', x: 33.0, y: 17.6, solid: [10, 6] },
  { key: 'lamp', x: 19.5, y: 4.0, solid: [10, 6] },
  { key: 'lamp', x: 24.5, y: 4.0, solid: [10, 6] },
  { key: 'lamp', x: 8.0, y: 26.6, solid: [10, 6] },
  { key: 'lamp', x: 22.0, y: 26.6, solid: [10, 6] },
  { key: 'lamp', x: 36.0, y: 26.6, solid: [10, 6] },
  { key: 'planter-tree', x: 19.4, y: 9.9, solid: [22, 10] },
  { key: 'planter-tree', x: 24.6, y: 9.9, solid: [22, 10] },
  { key: 'barrels', x: 34.0, y: 9.8, solid: [40, 14] },
  { key: 'crate', x: 9.5, y: 9.6, solid: [20, 10] },
];

export const trees: Array<[string, number, number]> = [
  ['tree-a', 1.2, 2.0], ['tree-b', 4.0, 1.2], ['pine-a', 6.8, 2.6], ['tree-c', 9.2, 1.4], ['tree-e', 12.0, 2.4], ['pine-b', 15.0, 1.6], ['tree-a', 17.6, 2.8],
  ['tree-d', 26.4, 2.6], ['pine-c', 28.8, 1.6], ['tree-b', 37.4, 2.0], ['tree-a', 40.2, 1.4], ['pine-a', 42.8, 2.6],
  ['tree-e', 0.8, 6.0], ['tree-a', 1.4, 10.4], ['pine-b', 0.8, 14.6], ['tree-d', 1.2, 19.0], ['tree-b', 0.6, 23.2], ['tree-a', 1.2, 29.6],
  ['tree-a', 43.0, 6.0], ['pine-c', 43.4, 10.6], ['tree-e', 42.8, 15.0], ['tree-b', 43.4, 19.2], ['tree-d', 43.0, 23.6], ['pine-a', 42.6, 29.8],
  ['tree-c', 5.0, 29.8], ['tree-a', 9.0, 30.4], ['pine-b', 13.0, 29.8], ['tree-e', 17.0, 30.4], ['tree-a', 27.0, 30.2], ['tree-d', 31.0, 29.8], ['pine-a', 35.0, 30.4], ['tree-b', 39.0, 29.8],
  ['tree-a', 37.0, 8.6], ['tree-e', 7.0, 9.2],
];

export const flowers: Array<[string, number, number]> = [
  ['flowers-big-1', 12.0, 9.9], ['flowers-big-5', 13.0, 9.9], ['flowers-mid-3', 18.4, 9.95], ['flowers-mid-0', 25.6, 9.95],
  ['flowers-big-6', 31.2, 9.95], ['flowers-big-8', 32.2, 9.95], ['flowers-mid-5', 9.6, 17.6], ['flowers-mid-1', 34.4, 17.6],
  ['flowers-big-2', 14.4, 18.4], ['flowers-big-4', 29.6, 18.4], ['flowers-small-5', 21.2, 18.4], ['flowers-small-1', 23.0, 18.4],
  ['bush-a', 3.4, 23.8], ['bush-b', 40.6, 23.8], ['bush-a', 15.6, 23.6], ['bush-b', 28.4, 23.6], ['flowers-big-0', 26.0, 23.7], ['flowers-mid-8', 17.6, 23.7],
  ['tall-grass-a', 4.2, 14.0], ['tall-grass-c', 39.0, 13.4], ['tall-grass-b', 6.4, 20.2], ['tall-grass-a', 38.0, 20.8],
];

export const fountain = { x: 22, y: 15.4 }; // feet of the fountain (tiles)
export const noticeBoard = { x: 25.6, y: 6.4 };

export const villagers: Array<{ name: string; lines: string[] }> = [
  { name: 'Mevrouw Tulp', lines: ['Goedemorgen! Of middag. Ik raak altijd de tel kwijt.', 'Heb je de fontein al gezien? Gisteren zat er een eend in. Met een hoedje.'] },
  { name: 'Bakker Bas', lines: ['Mijn brood is het beste van Heartwood.', 'Ik ben ook de enige bakker van Heartwood. Maar toch.'] },
  { name: 'Femke', lines: ['Ik heb gehoord dat PUCK bijna opengaat!', 'Ik ga Bitterbal Rush winnen. Let maar op.'] },
  { name: 'Opa Joop', lines: ['Vroeger was dit allemaal weiland.', 'Nou ja. Het is nog steeds best veel weiland.'] },
  { name: 'Lotte', lines: ['Woon jij in dat grote huis met die geiten?', 'Eén van die geiten stond vanochtend op mijn dak. Geen idee hoe.'] },
  { name: 'Ricardo', lines: ['Ik verkoop straks ijsjes op het plein.', 'Alle smaken. Behalve aardbei. Ik heb gehoord dat iemand hier daar niet van houdt.'] },
];
