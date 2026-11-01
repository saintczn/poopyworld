/**
 * Placeholder pixel art, drawn in code.
 * Every texture here will later be swapped for real pixel art with the same key and size,
 * so the game itself does not need to change.
 */
import Phaser from 'phaser';
import { TILE } from '../config';
import {
  Ground, MAP_WIDTH, MAP_HEIGHT, groundAreas, groundExceptions,
} from '../content/villaGarden';

// ---------- small helpers ----------

/** Deterministic random numbers, so the garden looks the same every time. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;

function px(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

/** Filled pixel circle with simple light (top-left) and shadow (bottom-right). */
function blob(c: Ctx, cx: number, cy: number, r: number, base: string, light: string, dark: string) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d > r * r) continue;
      let col = base;
      if (x + y < -r * 0.6) col = light;
      else if (x + y > r * 0.7 || d > (r - 1) * (r - 1) && y > 0) col = dark;
      px(c, cx + x, cy + y, 1, 1, col);
    }
  }
}

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) throw new Error(`Kon texture ${key} niet maken`);
  const c = tex.getContext();
  c.imageSmoothingEnabled = false;
  draw(c);
  tex.refresh();
  return tex;
}

// ---------- palette ----------

const P = {
  grass: '#69b34f', grass2: '#5ea546', grassLight: '#82c860', grassDark: '#4c8f3b',
  path: '#dcc08f', pathEdge: '#c3a26f', pathStone: '#cdb07d', pathDark: '#ae8b58',
  water: '#4a9fd6', waterDeep: '#3683bd', waterLight: '#8fd0f2', waterEdge: '#3d6d4a',
  soil: '#7b5134', soilDark: '#5e3c25', sprout: '#8fd36a',
  trunk: '#7a4f2d', trunkDark: '#5a381f',
  leaf: '#4f9e3f', leafLight: '#79c45a', leafDark: '#357a2e',
  fence: '#b9844f', fenceDark: '#8a5c33', fenceLight: '#d6a56b',
  wall: '#f3eee4', wallShade: '#d9d1c2', wood: '#a8754a', woodDark: '#7d5232',
  roof: '#4a4f57', roofLight: '#626872', glass: '#79b8d9', glassLight: '#bfe4f4', glassDark: '#4d86a6',
  ink: '#2b1f17',
};

// ---------- ground ----------

export function buildGround(scene: Phaser.Scene) {
  const grid: Ground[][] = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(Ground.Grass));
  for (const a of groundAreas) {
    for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) grid[y][x] = a.type;
  }
  for (const e of groundExceptions) grid[e.y][e.x] = e.type;

  const r = rng(7);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT ? Ground.Grass : grid[y][x]);

  canvasTexture(scene, 'ground', MAP_WIDTH * TILE, MAP_HEIGHT * TILE, (c) => {
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        const X = tx * TILE, Y = ty * TILE;
        const g = grid[ty][tx];
        // grass base everywhere (shows at edges)
        px(c, X, Y, TILE, TILE, P.grass);
        if (r() < 0.35) px(c, X + Math.floor(r() * 8), Y + Math.floor(r() * 8), 8, 8, P.grass2);
        for (let i = 0; i < 5; i++) {
          const gx = X + Math.floor(r() * 15), gy = Y + Math.floor(r() * 14);
          px(c, gx, gy, 1, 2, r() < 0.5 ? P.grassLight : P.grassDark);
        }
        if (r() < 0.06) { // tiny wild flower
          const fx = X + 3 + Math.floor(r() * 10), fy = Y + 3 + Math.floor(r() * 10);
          const col = ['#fff3a6', '#ffffff', '#f7a6c8'][Math.floor(r() * 3)];
          px(c, fx, fy, 1, 1, col); px(c, fx - 1, fy, 1, 1, col); px(c, fx + 1, fy, 1, 1, col); px(c, fx, fy - 1, 1, 1, col);
          px(c, fx, fy, 1, 1, '#f2b233');
        }

        if (g === Ground.Path) {
          px(c, X, Y, TILE, TILE, P.path);
          for (let i = 0; i < 3; i++) {
            const sx = X + 1 + Math.floor(r() * 12), sy = Y + 1 + Math.floor(r() * 12);
            px(c, sx, sy, 3, 2, P.pathStone); px(c, sx, sy + 2, 3, 1, P.pathDark);
          }
          // soft grass edges where the path meets grass
          if (at(tx, ty - 1) !== Ground.Path) px(c, X, Y, TILE, 1, P.pathEdge);
          if (at(tx, ty + 1) !== Ground.Path) px(c, X, Y + TILE - 1, TILE, 1, P.pathEdge);
          if (at(tx - 1, ty) !== Ground.Path) px(c, X, Y, 1, TILE, P.pathEdge);
          if (at(tx + 1, ty) !== Ground.Path) px(c, X + TILE - 1, Y, 1, TILE, P.pathEdge);
        } else if (g === Ground.Water) {
          px(c, X, Y, TILE, TILE, P.water);
          for (let i = 0; i < 2; i++) {
            const wx = X + 2 + Math.floor(r() * 10), wy = Y + 3 + Math.floor(r() * 10);
            px(c, wx, wy, 4, 1, P.waterLight);
          }
          if (at(tx, ty - 1) !== Ground.Water) { px(c, X, Y, TILE, 2, P.waterEdge); px(c, X, Y + 2, TILE, 2, P.waterDeep); }
          if (at(tx, ty + 1) !== Ground.Water) px(c, X, Y + TILE - 1, TILE, 1, P.waterEdge);
          if (at(tx - 1, ty) !== Ground.Water) px(c, X, Y, 1, TILE, P.waterEdge);
          if (at(tx + 1, ty) !== Ground.Water) px(c, X + TILE - 1, Y, 1, TILE, P.waterEdge);
        } else if (g === Ground.Soil) {
          px(c, X, Y, TILE, TILE, P.soil);
          for (let row = 2; row < TILE; row += 5) {
            px(c, X + 1, Y + row, TILE - 2, 1, P.soilDark);
            if (r() < 0.5) px(c, X + 4 + Math.floor(r() * 7), Y + row - 2, 1, 2, P.sprout);
          }
        } else if (g === Ground.Flowers) {
          px(c, X, Y, TILE, TILE, P.grassDark);
          const cols = ['#f25c78', '#ffd34d', '#ffffff', '#b884f0', '#ff9a3d'];
          for (let i = 0; i < 7; i++) {
            const fx = X + 2 + Math.floor(r() * 12), fy = Y + 2 + Math.floor(r() * 12);
            const col = cols[Math.floor(r() * cols.length)];
            px(c, fx, fy + 1, 1, 2, P.leafDark);
            px(c, fx - 1, fy, 3, 1, col); px(c, fx, fy - 1, 1, 3, col); px(c, fx, fy, 1, 1, '#f2b233');
          }
        }
      }
    }
  });
}

// ---------- objects ----------

export function buildObjects(scene: Phaser.Scene) {
  // Tree: 32x44, base (trunk foot) at bottom centre.
  canvasTexture(scene, 'tree', 32, 44, (c) => {
    px(c, 7, 39, 18, 4, 'rgba(0,0,0,0.18)');
    px(c, 13, 26, 6, 15, P.trunk); px(c, 17, 26, 2, 15, P.trunkDark); px(c, 11, 39, 10, 2, P.trunkDark);
    blob(c, 16, 15, 13, P.leaf, P.leafLight, P.leafDark);
    blob(c, 9, 20, 7, P.leaf, P.leafLight, P.leafDark);
    blob(c, 23, 20, 7, P.leaf, P.leafLight, P.leafDark);
    blob(c, 14, 9, 6, P.leafLight, '#9bd877', P.leaf);
  });

  canvasTexture(scene, 'bush', 18, 14, (c) => {
    px(c, 2, 11, 14, 3, 'rgba(0,0,0,0.15)');
    blob(c, 6, 8, 5, P.leaf, P.leafLight, P.leafDark);
    blob(c, 12, 8, 5, P.leaf, P.leafLight, P.leafDark);
    blob(c, 9, 5, 4, P.leafLight, '#9bd877', P.leaf);
    px(c, 5, 6, 1, 1, '#f25c78'); px(c, 12, 5, 1, 1, '#f25c78');
  });

  // Fence pieces (one tile each)
  canvasTexture(scene, 'fence-h', 16, 16, (c) => {
    px(c, 0, 6, 16, 2, P.fenceLight); px(c, 0, 8, 16, 1, P.fenceDark);
    px(c, 0, 11, 16, 2, P.fenceLight); px(c, 0, 13, 16, 1, P.fenceDark);
    px(c, 2, 3, 3, 13, P.fence); px(c, 2, 3, 3, 1, P.fenceLight); px(c, 4, 4, 1, 12, P.fenceDark);
    px(c, 10, 3, 3, 13, P.fence); px(c, 10, 3, 3, 1, P.fenceLight); px(c, 12, 4, 1, 12, P.fenceDark);
  });
  canvasTexture(scene, 'fence-v', 16, 16, (c) => {
    px(c, 7, 0, 2, 16, P.fenceLight); px(c, 9, 0, 1, 16, P.fenceDark);
    px(c, 6, 4, 4, 4, P.fence); px(c, 6, 12, 4, 4, P.fence);
  });

  // The villa: 224 x 144, modern countryside house, flat roofs, big windows, wood cladding.
  canvasTexture(scene, 'villa', 224, 144, (c) => {
    const W = 224;
    px(c, 4, 136, W - 8, 6, 'rgba(0,0,0,0.2)');
    // ground floor body
    px(c, 8, 72, W - 16, 66, P.wall);
    px(c, 8, 132, W - 16, 6, P.wallShade);
    // first floor body (set back), left part is wood cladding
    px(c, 20, 22, 120, 54, P.wall);
    px(c, 140, 30, 64, 46, P.wood);
    for (let x = 142; x < 204; x += 4) px(c, x, 30, 1, 46, P.woodDark);
    // roofs
    px(c, 14, 14, 132, 9, P.roof); px(c, 14, 14, 132, 2, P.roofLight);
    px(c, 136, 24, 74, 7, P.roof); px(c, 136, 24, 74, 2, P.roofLight);
    px(c, 2, 66, W - 4, 7, P.roof); px(c, 2, 66, W - 4, 2, P.roofLight);
    // first floor windows
    const win = (x: number, y: number, w: number, h: number) => {
      px(c, x - 1, y - 1, w + 2, h + 2, P.roof);
      px(c, x, y, w, h, P.glass);
      px(c, x, y, w, 2, P.glassLight); px(c, x + 2, y + 3, 2, h - 6, P.glassLight);
      px(c, x, y + h - 2, w, 2, P.glassDark);
      px(c, x + Math.floor(w / 2), y, 1, h, P.roof);
    };
    win(30, 32, 30, 30); win(70, 32, 30, 30);
    win(152, 40, 40, 22);
    // balcony
    px(c, 108, 58, 30, 2, P.roofLight); px(c, 108, 60, 30, 10, 'rgba(191,228,244,0.55)'); px(c, 108, 69, 30, 1, P.roof);
    // ground floor windows (wide)
    win(20, 84, 58, 38); win(146, 84, 58, 38);
    // front door (center x=112), wood with glass strip
    px(c, 98, 92, 28, 46, P.roof);
    px(c, 100, 94, 24, 44, P.wood);
    for (let y = 96; y < 138; y += 4) px(c, 100, y, 24, 1, P.woodDark);
    px(c, 120, 112, 2, 6, '#f2c94c');
    px(c, 88, 100, 8, 30, P.glass); px(c, 88, 100, 8, 2, P.glassLight); // side light
    px(c, 128, 100, 8, 30, P.glass); px(c, 128, 100, 8, 2, P.glassLight);
    // wall lamps
    px(c, 92, 90, 3, 4, '#ffe08a'); px(c, 129, 90, 3, 4, '#ffe08a');
    // planters
    px(c, 82, 128, 10, 10, P.roof); blob(c, 87, 125, 5, P.leaf, P.leafLight, P.leafDark);
    px(c, 132, 128, 10, 10, P.roof); blob(c, 137, 125, 5, P.leaf, P.leafLight, P.leafDark);
  });

  // Flag poles: 2 frames each (waving)
  const flag = (key: string, stripes: (c: Ctx, x: number, y: number, wave: number) => void) => {
    canvasTexture(scene, key, 40, 44, (c) => {
      for (let f = 0; f < 2; f++) {
        const ox = f * 20;
        px(c, ox + 3, 41, 6, 2, 'rgba(0,0,0,0.2)');
        px(c, ox + 5, 2, 2, 40, '#9aa1a8'); px(c, ox + 5, 2, 1, 40, '#c9cfd4');
        px(c, ox + 4, 0, 4, 2, '#f2c94c');
        stripes(c, ox + 7, 4, f);
      }
    });
    const t = scene.textures.get(key);
    t.add(0, 0, 0, 0, 20, 44);
    t.add(1, 0, 20, 0, 20, 44);
  };
  flag('flag-ng', (c, x, y, wave) => {
    for (let i = 0; i < 12; i++) {
      const dy = wave ? (i % 4 < 2 ? 1 : 0) : (i % 4 < 2 ? 0 : 1);
      const col = i < 4 ? '#118a4e' : i < 8 ? '#ffffff' : '#118a4e';
      px(c, x + i, y + dy, 1, 9, col);
    }
  });
  flag('flag-nl', (c, x, y, wave) => {
    for (let i = 0; i < 12; i++) {
      const dy = wave ? (i % 4 < 2 ? 1 : 0) : (i % 4 < 2 ? 0 : 1);
      px(c, x + i, y + dy, 1, 3, '#ae1c28');
      px(c, x + i, y + dy + 3, 1, 3, '#ffffff');
      px(c, x + i, y + dy + 6, 1, 3, '#21468b');
    }
  });

  canvasTexture(scene, 'mailbox', 14, 22, (c) => {
    px(c, 3, 20, 8, 2, 'rgba(0,0,0,0.2)');
    px(c, 6, 10, 2, 11, P.woodDark);
    px(c, 1, 2, 12, 9, '#d64545'); px(c, 1, 2, 12, 2, '#f07070'); px(c, 1, 10, 12, 1, '#9e2a2a');
    px(c, 3, 5, 8, 1, '#7a1f1f');
    px(c, 12, 3, 1, 5, '#f2c94c');
  });

  // Kroki's perch: a wooden T-stand with a water bowl and a small swing
  canvasTexture(scene, 'perch', 26, 34, (c) => {
    px(c, 5, 31, 16, 3, 'rgba(0,0,0,0.2)');
    px(c, 6, 29, 14, 3, P.woodDark);
    px(c, 12, 6, 3, 24, P.wood); px(c, 14, 6, 1, 24, P.woodDark);
    px(c, 2, 5, 22, 3, P.wood); px(c, 2, 5, 22, 1, P.fenceLight);
    px(c, 2, 8, 2, 4, P.woodDark); px(c, 22, 8, 2, 4, P.woodDark);
    px(c, 1, 12, 5, 3, '#4a9fd6'); px(c, 1, 12, 5, 1, '#8fd0f2'); // bowl
    px(c, 21, 12, 4, 3, '#f2c94c'); // seed cup
    px(c, 4, 1, 1, 4, '#c9cfd4'); px(c, 4, 0, 6, 1, '#f25c78'); // little toy
  });

  // Outdoor dining: table for two + barbecue (48 x 30)
  canvasTexture(scene, 'dining', 48, 30, (c) => {
    px(c, 2, 26, 44, 4, 'rgba(0,0,0,0.18)');
    // bbq
    px(c, 2, 10, 12, 8, '#3a3d42'); px(c, 2, 10, 12, 2, '#5b6068'); px(c, 4, 18, 2, 9, '#3a3d42'); px(c, 10, 18, 2, 9, '#3a3d42');
    px(c, 5, 7, 2, 2, '#c9cfd4'); px(c, 9, 5, 2, 3, '#c9cfd4');
    // table
    px(c, 20, 10, 24, 7, P.wood); px(c, 20, 10, 24, 2, P.fenceLight); px(c, 20, 17, 24, 1, P.woodDark);
    px(c, 22, 18, 2, 9, P.woodDark); px(c, 40, 18, 2, 9, P.woodDark);
    px(c, 26, 9, 4, 2, '#ffffff'); px(c, 35, 9, 4, 2, '#ffffff'); // plates
    // two chairs
    px(c, 16, 14, 4, 10, P.woodDark); px(c, 44, 14, 4, 10, P.woodDark);
  });

  canvasTexture(scene, 'sign', 16, 20, (c) => {
    px(c, 4, 18, 8, 2, 'rgba(0,0,0,0.2)');
    px(c, 7, 9, 2, 10, P.woodDark);
    px(c, 1, 1, 14, 9, P.wood); px(c, 1, 1, 14, 1, P.fenceLight); px(c, 1, 9, 14, 1, P.woodDark);
    px(c, 3, 4, 10, 1, P.woodDark); px(c, 3, 6, 7, 1, P.woodDark);
  });

  canvasTexture(scene, 'shelter', 40, 34, (c) => {
    px(c, 3, 30, 36, 4, 'rgba(0,0,0,0.2)');
    px(c, 5, 12, 30, 20, P.wood);
    for (let x = 7; x < 35; x += 4) px(c, x, 12, 1, 20, P.woodDark);
    px(c, 15, 18, 10, 14, '#3b2a1e');
    // roof
    for (let i = 0; i < 12; i++) px(c, 1 + i, 12 - i, 38 - 2 * i, 1, i % 3 === 0 ? '#9e3b2a' : '#c0503a');
    px(c, 26, 26, 8, 5, '#e9c46a'); px(c, 26, 26, 8, 1, '#f4dc94'); // hay
  });

  // "Press E" bubble
  canvasTexture(scene, 'key-e', 11, 12, (c) => {
    px(c, 0, 0, 11, 10, '#3b2a1e'); px(c, 1, 1, 9, 8, '#fff6e4'); px(c, 4, 10, 3, 2, '#3b2a1e');
    px(c, 3, 2, 1, 6, '#3b2a1e'); px(c, 3, 2, 5, 1, '#3b2a1e'); px(c, 3, 4, 4, 1, '#3b2a1e'); px(c, 3, 7, 5, 1, '#3b2a1e');
  });

  canvasTexture(scene, 'shadow', 12, 4, (c) => {
    px(c, 2, 0, 8, 4, 'rgba(0,0,0,0.22)'); px(c, 0, 1, 12, 2, 'rgba(0,0,0,0.22)');
  });
}

// ---------- player ----------

/** Player frames: 16x24, rows = down, left, right, up; columns = stand, step A, step B. */
export function buildPlayer(scene: Phaser.Scene, key: string, look: { hair: string; shirt: string; skin: string; pants: string }) {
  const FW = 16, FH = 24;
  const dirs = ['down', 'left', 'right', 'up'] as const;
  canvasTexture(scene, key, FW * 3, FH * 4, (c) => {
    dirs.forEach((dir, row) => {
      for (let step = 0; step < 3; step++) {
        const X = step * FW, Y = row * FH;
        const bob = step === 0 ? 0 : 1;
        const legA = step === 1 ? -1 : 0, legB = step === 2 ? -1 : 0;
        // legs + shoes
        if (dir === 'left' || dir === 'right') {
          px(c, X + 6, Y + 18 + legA, 2, 5 - legA, look.pants); px(c, X + 8, Y + 18 + legB, 2, 5 - legB, look.pants);
          px(c, X + (dir === 'left' ? 5 : 6), Y + 22, 3, 2, '#3b2a1e'); px(c, X + (dir === 'left' ? 7 : 8), Y + 22, 3, 2, '#3b2a1e');
        } else {
          px(c, X + 5, Y + 18 + legA, 3, 5 - legA, look.pants); px(c, X + 8, Y + 18 + legB, 3, 5 - legB, look.pants);
          px(c, X + 5, Y + 22, 3, 2, '#3b2a1e'); px(c, X + 8, Y + 22, 3, 2, '#3b2a1e');
        }
        const by = Y + bob;
        // body
        px(c, X + 4, by + 11, 8, 8, look.shirt);
        px(c, X + 4, by + 17, 8, 1, 'rgba(0,0,0,0.2)');
        // arms
        if (dir === 'down' || dir === 'up') {
          px(c, X + 3, by + 12 + (step === 1 ? 1 : 0), 1, 5, look.skin); px(c, X + 12, by + 12 + (step === 2 ? 1 : 0), 1, 5, look.skin);
        } else {
          px(c, X + 7, by + 12, 2, 5, look.shirt); px(c, X + 7, by + 16, 2, 1, look.skin);
        }
        // head
        px(c, X + 4, by + 3, 8, 8, look.skin);
        px(c, X + 4, by + 10, 8, 1, 'rgba(0,0,0,0.12)');
        // hair
        px(c, X + 3, by + 1, 10, 4, look.hair);
        if (dir === 'up') px(c, X + 3, by + 1, 10, 9, look.hair);
        if (dir === 'left') px(c, X + 9, by + 1, 4, 8, look.hair);
        if (dir === 'right') px(c, X + 3, by + 1, 4, 8, look.hair);
        if (dir === 'down') { px(c, X + 3, by + 4, 1, 4, look.hair); px(c, X + 12, by + 4, 1, 4, look.hair); }
        // eyes
        if (dir === 'down') { px(c, X + 6, by + 6, 1, 2, P.ink); px(c, X + 9, by + 6, 1, 2, P.ink); px(c, X + 5, by + 8, 1, 1, '#f2a3a3'); px(c, X + 10, by + 8, 1, 1, '#f2a3a3'); }
        if (dir === 'left') px(c, X + 5, by + 6, 1, 2, P.ink);
        if (dir === 'right') px(c, X + 10, by + 6, 1, 2, P.ink);
      }
    });
  });
  const tex = scene.textures.get(key);
  let i = 0;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) tex.add(i++, 0, col * FW, row * FH, FW, FH);

  dirs.forEach((dir, row) => {
    const base = row * 3;
    scene.anims.create({ key: `${key}-walk-${dir}`, frames: [base + 1, base, base + 2, base].map((f) => ({ key, frame: f })), frameRate: 8, repeat: -1 });
    scene.anims.create({ key: `${key}-idle-${dir}`, frames: [{ key, frame: base }], frameRate: 1 });
  });
}
