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
import floorwood from './assets/floor_wood.png';
import walls from './assets/walls.png';
import sofa from './assets/sofa.png';
import fireplace from './assets/fireplace.png';
import rug from './assets/rug.png';
import shelf from './assets/shelf.png';
import tv from './assets/tv.png';
import counter from './assets/counter.png';
import sink from './assets/sink.png';
import oven from './assets/oven.png';
import fridge from './assets/fridge.png';
import floorlamp from './assets/floorlamp.png';
import paintings from './assets/paintings.png';
import clock from './assets/clock.png';
import window from './assets/window.png';
import endtable from './assets/endtable.png';

import goatWhite from './assets/goat-white.png';
import goatBrown from './assets/goat-brown.png';
import goatBlack from './assets/goat-black.png';
import chickenWalk from './assets/chicken-walk.png';
import chickenEat from './assets/chicken-eat.png';

/** Animal sheets: [url, frame size]. */
export const animalSheets: Record<string, [string, number]> = {
  'goat-white': [goatWhite, 128], 'goat-brown': [goatBrown, 128], 'goat-black': [goatBlack, 128],
  'chicken-walk': [chickenWalk, 32], 'chicken-eat': [chickenEat, 32],
};

import houseBlue from './assets/house-blue.png';
import houseGreen from './assets/house-green.png';
import housePurple from './assets/house-purple.png';
import cottage from './assets/cottage.png';
import cottageBlue from './assets/cottage-blue.png';
import houseB from './assets/house-b.png';
import fountain from './assets/fountain.png';
import villa from './assets/villa.png';
import manor from './assets/manor.png';
import portraits from './assets/portraits.png';
import candles from './assets/candles.png';
import floorlights from './assets/floorlights.png';
import seals from './assets/seals.png';
import slab from './assets/slab.png';
import desk from './assets/desk.png';

import worldmap from './assets/worldmap.png';
import busstop from './assets/busstop.png';
import plane from './assets/plane.png';
import barstools from './assets/barstools.png';

/** Bali art drawn by tools/build_bali.py: bali-palm-a.png becomes the texture 'bali-palm-a'. */
const baliFiles = import.meta.glob('./assets/bali-*.png', { eager: true, import: 'default' }) as Record<string, string>;
const bali = Object.fromEntries(Object.entries(baliFiles).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]));

export const sheets = {
  ...bali, worldmap, busstop, plane, barstools,
  'house-blue': houseBlue, 'house-green': houseGreen, 'house-purple': housePurple, cottage, 'cottage-blue': cottageBlue, 'house-b': houseB, fountain, villa, manor, portraits, candles, floorlights, seals, slab, desk,
  terrain, trees, plants, flowers, wildflowers, rocks, soil, fence, house, table, trough,
  lamp, planter, barrel, crate, hay, campfire, buckets, baskets,
  floorwood, walls, sofa, fireplace, rug, shelf, tv, counter, sink, oven, fridge, floorlamp, paintings, clock, window, endtable,
};

type Rect = [x: number, y: number, w: number, h: number];

/** Named sprites: [sheet, x, y, w, h]. */
export const sprites: Record<string, [keyof typeof sheets, ...Rect]> = {
  // trees (feet at the bottom of the box)
  'tree-a': ['trees', 129, 16, 94, 100],
  'tree-b': ['trees', 225, 16, 94, 110],
  'tree-c': ['trees', 321, 16, 94, 125],
  'tree-d': ['trees', 129, 272, 94, 100],
  'tree-e': ['trees', 225, 272, 94, 110],
  'tree-bare': ['trees', 3, 274, 90, 123],
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
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`barstool-${i}`, ['barstools', i * 32, 0, 32, 32]])),
  'crates': ['crate', 0, 32, 64, 32],
  'bucket': ['buckets', 5, 37, 21, 24],
  'basket': ['baskets', 32, 0, 32, 26],
  'fire-0': ['campfire', 0, 32, 32, 32],
  'fire-1': ['campfire', 32, 32, 32, 32],
  'fire-2': ['campfire', 64, 32, 32, 32],
  'fire-3': ['campfire', 96, 32, 32, 32],
  // Hollowmere Manor
  'portrait-a': ['portraits', 2, 8, 29, 49],
  'portrait-b': ['portraits', 34, 8, 29, 49],
  'portrait-c': ['portraits', 66, 8, 29, 49],
  'portrait-small': ['portraits', 102, 1, 17, 25],
  'candle': ['candles', 139, 2, 10, 20],
  'candelabra': ['floorlights', 64, 0, 32, 57],
  'seal-gold': ['seals', 0, 0, 64, 63],
  'seal-dark': ['seals', 64, 64, 64, 63],
  'slab': ['slab', 0, 16, 64, 16],
  'desk': ['desk', 0, 12, 96, 40],
  // indoors
  'sofa-front': ['sofa', 321, 17, 94, 38],
  'sofa-back': ['sofa', 321, 65, 94, 31],
  'armchair-side': ['sofa', 451, 0, 29, 56],
  'fireplace': ['fireplace', 108, 15, 72, 70],
  'rug-blue': ['rug', 0, 0, 160, 64],
  'rug-rose': ['rug', 0, 64, 160, 64],
  'bookshelf': ['shelf', 112, 11, 32, 85],
  'bookshelf-b': ['shelf', 176, 0, 32, 96],
  'low-shelf': ['shelf', 0, 11, 96, 20],
  'tv': ['tv', 134, 5, 84, 52],
  'counter-run': ['counter', 16, 160, 170, 50],
  'sink': ['sink', 3, 0, 61, 29],
  'oven': ['oven', 0, 9, 32, 41],
  'fridge': ['fridge', 32, 2, 32, 62],
  'floorlamp': ['floorlamp', 4, 2, 24, 49],
  'painting-wide': ['paintings', 7, 69, 81, 25],
  'painting-small': ['paintings', 13, 33, 39, 31],
  'painting-tall': ['paintings', 98, 67, 29, 49],
  'clock': ['clock', 7, 22, 18, 71],
  'window': ['window', 32, 22, 32, 74],
  'endtable': ['endtable', 6, 3, 20, 24],
  'potted-plant': ['planter', 128, 32, 32, 52],
};
