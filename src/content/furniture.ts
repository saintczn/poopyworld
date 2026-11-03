/** Furniture you can place in the house while decorating. Sizes are the solid base in pixels. */
export type FurnitureDef = { key: string; name: string; solid?: [number, number]; floor?: boolean; turnsInto?: string };

export const FURNITURE: FurnitureDef[] = [
  { key: 'sofa-back', name: 'Bank', solid: [90, 18], turnsInto: 'sofa-front' },
  { key: 'sofa-front', name: 'Bank (andersom)', solid: [90, 18], turnsInto: 'sofa-back' },
  { key: 'armchair-side', name: 'Fauteuil', solid: [24, 14] },
  { key: 'table', name: 'Tafel', solid: [74, 14] },
  { key: 'stool', name: 'Krukje', solid: [18, 8] },
  { key: 'endtable', name: 'Bijzettafel', solid: [18, 8] },
  { key: 'low-shelf', name: 'Laag kastje', solid: [90, 10] },
  { key: 'bookshelf-b', name: 'Boekenkast', solid: [30, 10] },
  { key: 'floorlamp', name: 'Staande lamp', solid: [12, 6] },
  { key: 'potted-plant', name: 'Kamerplant', solid: [22, 8] },
  { key: 'planter-fern', name: 'Varen', solid: [22, 8] },
  { key: 'planter-tree', name: 'Boompje', solid: [22, 10] },
  { key: 'pot-flowers', name: 'Bloempot' },
  { key: 'barrel', name: 'Ton', solid: [22, 10] },
  { key: 'basket', name: 'Mand' },
  { key: 'rug-blue', name: 'Kleed blauw', floor: true },
  { key: 'rug-rose', name: 'Kleed roze', floor: true },
];

export const FURNITURE_BY_KEY = Object.fromEntries(FURNITURE.map((f) => [f.key, f]));

export type PlacedItem = { id: number; key: string; x: number; y: number; flip: boolean; z?: number };

export const DEFAULT_HOUSE: PlacedItem[] = [
  { id: 1, key: 'rug-blue', x: 160, y: 304, flip: false },
  { id: 2, key: 'sofa-back', x: 160, y: 318, flip: false },
  { id: 3, key: 'endtable', x: 224, y: 312, flip: false },
  { id: 4, key: 'floorlamp', x: 96, y: 314, flip: false },
  { id: 5, key: 'rug-rose', x: 370, y: 340, flip: false },
  { id: 6, key: 'table', x: 370, y: 330, flip: false },
  { id: 7, key: 'stool', x: 322, y: 336, flip: false },
  { id: 8, key: 'stool', x: 418, y: 336, flip: false },
  { id: 9, key: 'potted-plant', x: 462, y: 372, flip: false },
  { id: 10, key: 'planter-fern', x: 52, y: 372, flip: false },
  { id: 11, key: 'pot-flowers', x: 224, y: 290, flip: false, z: 313 },
  { id: 12, key: 'pot-flowers', x: 370, y: 312, flip: false, z: 331 },
];
