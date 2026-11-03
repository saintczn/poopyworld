/**
 * All pixel art files and the named pieces cut out of them.
 * Art: LPC Revised (https://github.com/ElizaWy/LPC), OGA-BY 3.0 — see CREDITS.md.
 */
import terrain from './assets/terrain.png';
import trees from './assets/trees.png';
import plants from './assets/plants.png';
import flowers from './assets/flowers.png';
import wildflowers from './assets/wildflowers.png';
import rocks from './assets/rocks.png';
import soil from './assets/soil.png';
import fence from './assets/fence.png';
import house from './assets/house.png';
import table from './assets/table.png';
import trough from './assets/trough.png';
import lamp from './assets/lamp.png';
import planter from './assets/planter.png';
import barrel from './assets/barrel.png';
import crate from './assets/crate.png';
import hay from './assets/hay.png';
import campfire from './assets/campfire.png';
import buckets from './assets/buckets.png';
import baskets from './assets/baskets.png';
import playerWalk from './assets/player_walk.png';
import playerIdle from './assets/player_idle.png';

export const sheets = {
  terrain, trees, plants, flowers, wildflowers, rocks, soil, fence, house, table, trough,
  lamp, planter, barrel, crate, hay, campfire, buckets, baskets,
};

export const characterSheets = { playerWalk, playerIdle };

type Rect = [x: number, y: number, w: number, h: number];

/** Named sprites: [sheet, x, y, w, h]. */
export const sprites: Record<string, [keyof typeof sheets, ...Rect]> = {
  // trees (feet at the bottom of the box)
  'tree-a': ['trees', 129, 16, 94, 100],
  'tree-b': ['trees', 225, 16, 94, 110],
  'tree-c': ['trees', 321, 16, 94, 125],
  'tree-d': ['trees', 129, 272, 94, 100],
  'tree-e': ['trees', 225, 272, 94, 110],
  'pine-a': ['trees', 132, 389, 85, 104],
  'pine-b': ['trees', 228, 389, 85, 111],
  'pine-c': ['trees', 324, 421, 85, 91],
  'shadow-tree': ['trees', 16, 25, 64, 31],
  'shadow-pine': ['trees', 19, 153, 59, 30],
  // plants
  'bush-a': ['plants', 0, 0, 32, 32],
  'bush-b': ['plants', 32, 0, 32, 32],
  'leafy-a': ['plants', 64, 0, 32, 32],
  'leafy-b': ['plants', 96, 0, 32, 32],
  'leafy-c': ['plants', 64, 32, 32, 32],
  'leafy-d': ['plants', 96, 32, 32, 32],
  'cypress-a': ['plants', 0, 64, 32, 64],
  'cypress-b': ['plants', 32, 64, 32, 64],
  'fern': ['plants', 99, 77, 55, 51],
  'tall-grass-a': ['plants', 263, 23, 22, 28],
  'tall-grass-b': ['plants', 295, 23, 22, 28],
  'tall-grass-c': ['plants', 259, 63, 27, 43],
  'reeds-a': ['plants', 456, 69, 13, 18],
  'reeds-b': ['plants', 488, 69, 12, 18],
  'lily-a': ['plants', 388, 138, 24, 15],
  'lily-b': ['plants', 391, 107, 17, 13],
  'lily-c': ['plants', 386, 74, 26, 16],
  // flower bushes (9 colours: white, pink, red, blue, plum, yellow, orange, gold, sky)
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`flowers-big-${i}`, ['flowers', i * 32, 0, 32, 32]])),
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`flowers-mid-${i}`, ['flowers', i * 32, 37, 31, 27]])),
  ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`flowers-small-${i}`, ['flowers', i * 32 + 4, 70, 23, 20]])),
  // rocks
  'rock-big': ['rocks', 130, 3, 59, 54],
  'rock-mid': ['rocks', 163, 77, 27, 14],
  'rock-small': ['rocks', 170, 108, 15, 8],
  // fence pieces
  'fence-h': ['fence', 32, 0, 32, 32],
  'fence-h-end': ['fence', 64, 0, 32, 32],
  'fence-v-top': ['fence', 96, 0, 32, 32],
  'fence-v-mid': ['fence', 96, 32, 32, 32],
  'fence-v-post': ['fence', 96, 64, 32, 32],
  'fence-v-bottom': ['fence', 96, 96, 32, 32],
  // house
  'house': ['house', 0, 0, 256, 224],
  // props
  'table': ['table', 8, 150, 80, 42],
  'stool': ['table', 160, 32, 32, 32],
  'trough-water': ['trough', 65, 64, 62, 32],
  'trough-hay': ['trough', 65, 192, 62, 32],
  'hay-green': ['hay', 3, 18, 57, 76],
  'hay-gold': ['hay', 67, 18, 57, 78],
  'lamp': ['lamp', 7, 4, 18, 80],
  'planter-fern': ['planter', 0, 32, 32, 52],
  'planter-tree': ['planter', 32, 3, 32, 81],
  'pot-flowers': ['planter', 130, 10, 28, 22],
  'barrel': ['barrel', 2, 10, 28, 37],
  'barrels': ['barrel', 96, 2, 48, 61],
  'crate': ['crate', 4, 0, 24, 32],
  'crates': ['crate', 0, 32, 64, 32],
  'bucket': ['buckets', 5, 37, 21, 24],
  'basket': ['baskets', 32, 0, 32, 26],
  'fire-0': ['campfire', 0, 32, 32, 32],
  'fire-1': ['campfire', 32, 32, 32, 32],
  'fire-2': ['campfire', 64, 32, 32, 32],
  'fire-3': ['campfire', 96, 32, 32, 32],
};
