/**
 * Paints the ground of a map into one big texture:
 * dirt underneath, grass on top with soft edges (dual-grid autotiling),
 * then the pond, tilled soil and tiny wild flowers.
 */
import Phaser from 'phaser';
import { TILE } from '../config';

type Rect = { x: number; y: number; w: number; h: number };
export type GroundSpec = {
  w: number; h: number; dirt: Rect[]; pond?: Rect; soil?: Rect; seed?: number;
  /** What lies under the grass: dirt (default) or beach sand. */
  base?: 'dirt' | 'sand';
  /** Darker sand paths, painted under the grass. */
  paths?: Rect[];
  /** Whether the world beyond the map edge counts as grass (default yes). */
  edgeGrass?: boolean;
  /** Row where the sea begins (it fills the map below, with a foamy shore). */
  sea?: number;
};

const T = TILE;
const H = T / 2;

/** Deterministic random numbers, so the world looks the same every time. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pieces of the terrain sheet, in tiles.
const DIRT_FILL: Array<[number, number]> = [[3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [5, 4]];
const GRASS_FILL: Array<[number, number]> = [[3, 1], [4, 1], [5, 1], [3, 2], [4, 2], [5, 2], [1, 1]];
// Grass edge pieces by corner mask (TL=1, TR=2, BL=4, BR=8).
const GRASS_EDGE: Record<number, [number, number]> = {
  8: [0, 0], 12: [1, 0], 4: [2, 0], 10: [0, 1], 5: [2, 1], 2: [0, 2], 3: [1, 2], 1: [2, 2],
};
const GRASS_HOLE: [number, number] = [1, 4]; // its quarters hold the inside-corner fringes
const POND: [number, number] = [0, 10]; // 3x3 block, nine-slice
export const SAND_LIGHT: Array<[number, number]> = [[3, 5], [4, 5], [5, 5]];
const SAND_DARK: Array<[number, number]> = [[3, 6], [4, 6], [5, 6]];

export function paintGround(scene: Phaser.Scene, key: string, spec: GroundSpec) {
  const terrain = scene.textures.get('terrain').getSourceImage() as HTMLImageElement;
  const soilImg = scene.textures.get('soil').getSourceImage() as HTMLImageElement;
  const wild = scene.textures.get('wildflowers').getSourceImage() as HTMLImageElement;
  const r = rng(spec.seed ?? 11);
  const { w, h } = spec;

  if (scene.textures.exists(key)) return; // already painted (coming back to this place)
  const tex = scene.textures.createCanvas(key, w * T, h * T)!;
  const c = tex.getContext();
  c.imageSmoothingEnabled = false;
  const tile = (src: CanvasImageSource, sx: number, sy: number, dx: number, dy: number, sw = T, sh = T) =>
    c.drawImage(src, sx, sy, sw, sh, dx, dy, sw, sh);
  const pick = <V>(list: V[]) => list[Math.floor(r() * list.length)];

  // Which cells are grass?
  const grass: boolean[][] = Array.from({ length: h }, () => Array(w).fill(true));
  for (const d of spec.dirt) {
    for (let y = d.y; y < d.y + d.h; y++) for (let x = d.x; x < d.x + d.w; x++) if (grass[y]) grass[y][x] = false;
  }
  const g = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? spec.edgeGrass ?? true : grass[y][x]);

  // 1. Dirt (or sand) everywhere, then the paths.
  const fill = spec.base === 'sand' ? SAND_DARK : DIRT_FILL;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [sx, sy] = pick(fill);
    tile(terrain, sx * T, sy * T, x * T, y * T);
  }
  for (const p of spec.paths ?? []) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
    const [sx, sy] = pick(spec.base === 'sand' ? SAND_LIGHT : SAND_DARK);
    tile(terrain, sx * T, sy * T, x * T, y * T);
  }

  // 2. Grass on a grid shifted by half a tile; each piece looks at the 4 cells around its centre.
  for (let j = 0; j <= h; j++) for (let i = 0; i <= w; i++) {
    const tl = g(i - 1, j - 1), tr = g(i, j - 1), bl = g(i - 1, j), br = g(i, j);
    const mask = (tl ? 1 : 0) | (tr ? 2 : 0) | (bl ? 4 : 0) | (br ? 8 : 0);
    const dx = i * T - H, dy = j * T - H;
    if (mask === 0) continue;
    if (mask === 15) {
      const [sx, sy] = pick(GRASS_FILL);
      tile(terrain, sx * T, sy * T, dx, dy);
      continue;
    }
    const edge = GRASS_EDGE[mask];
    if (edge) {
      tile(terrain, edge[0] * T, edge[1] * T, dx, dy);
      continue;
    }
    // Inside corners and diagonals: build the piece from quarters.
    const [fx, fy] = pick(GRASS_FILL);
    const quarters: Array<[boolean, number, number]> = [[tl, 0, 0], [tr, H, 0], [bl, 0, H], [br, H, H]];
    for (const [isGrass, qx, qy] of quarters) {
      if (isGrass) tile(terrain, fx * T + qx, fy * T + qy, dx + qx, dy + qy, H, H);
      else tile(terrain, GRASS_HOLE[0] * T + (H - qx), GRASS_HOLE[1] * T + (H - qy), dx + qx, dy + qy, H, H);
    }
  }

  // 3. Tiny wild flowers sprinkled on open grass.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let open = true;
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (!g(xx, yy)) open = false;
    if (!open || r() > 0.16) continue;
    const cx = Math.floor(r() * 9), cy = Math.floor(r() * 10);
    tile(wild, cx * 16, cy * 16, x * T + Math.floor(r() * 16), y * T + Math.floor(r() * 16), 16, 16);
  }

  // 4. Nine-slice areas (pond, soil).
  const nine = (src: CanvasImageSource, ox: number, oy: number, rect: Rect, centre?: () => [number, number]) => {
    for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
      const col = x === 0 ? 0 : x === rect.w - 1 ? 2 : 1;
      const row = y === 0 ? 0 : y === rect.h - 1 ? 2 : 1;
      let sx = (ox + col) * T, sy = (oy + row) * T;
      if (col === 1 && row === 1 && centre) [sx, sy] = centre().map((v) => v * T) as [number, number];
      tile(src, sx, sy, (rect.x + x) * T, (rect.y + y) * T);
    }
  };
  if (spec.pond) nine(terrain, POND[0], POND[1], spec.pond, () => [1, 11]);
  if (spec.soil) nine(soilImg, 0, 0, spec.soil);

  // 5. The sea: foamy shore, shallow water, then deep blue.
  if (spec.sea !== undefined) {
    for (let y = spec.sea; y < h; y++) for (let x = 0; x < w; x++) {
      const d = y - spec.sea;
      const [sx, sy] = d === 0 ? [1, 20] : d < 4 ? [1, 21] : d === 4 ? [1, 23] : [1, 24];
      tile(terrain, sx * T, sy * T, x * T, y * T);
    }
  }

  tex.refresh();
}
