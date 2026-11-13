import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { Darkness } from '../world/darkness';
import { Patrol } from '../world/patrol';
import { askChoice } from '../ui/memories';
import { loadMystery, saveMystery, TUNNELS } from '../content/mystery';

/**
 * The tunnels under the hill: a maze (always the same one), pitch dark, with hooded members of the
 * Lantaarnkring patrolling. A riddle door guards the fourth seal; the star door at the far end leads on.
 */
const T = 32;
const CW = 12, CH = 8;             // maze cells
const CELL = 3;                    // tiles per cell (2 floor + 1 wall)
const TW = CW * CELL + 1, TH = CH * CELL + 1;

type Cell = { c: number; r: number };

function buildMaze() {
  // recursive backtracker with a fixed seed, so the tunnels are the same every visit
  let seed = 1925;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const open = new Set<string>(); // "c,r|c,r" passages
  const seen = new Set<string>(['0,0']);
  const stack: Cell[] = [{ c: 0, r: 0 }];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => ({ c: cur.c + dc, r: cur.r + dr }))
      .filter((n) => n.c >= 0 && n.r >= 0 && n.c < CW && n.r < CH && !seen.has(`${n.c},${n.r}`));
    if (!nbrs.length) { stack.pop(); continue; }
    const n = nbrs[Math.floor(rnd() * nbrs.length)];
    seen.add(`${n.c},${n.r}`);
    open.add(`${cur.c},${cur.r}|${n.c},${n.r}`); open.add(`${n.c},${n.r}|${cur.c},${cur.r}`);
    stack.push(n);
  }
  // a few extra openings so it is not one single path
  for (let i = 0; i < 9; i++) {
    const c = Math.floor(rnd() * (CW - 1)), r = Math.floor(rnd() * CH);
    open.add(`${c},${r}|${c + 1},${r}`); open.add(`${c + 1},${r}|${c},${r}`);
  }
  // tiles: true = wall
  const wall: boolean[][] = Array.from({ length: TH }, () => Array(TW).fill(true));
  for (let r = 0; r < CH; r++) for (let c = 0; c < CW; c++) {
    const x0 = c * CELL + 1, y0 = r * CELL + 1;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) wall[y0 + y][x0 + x] = false;
    if (open.has(`${c},${r}|${c + 1},${r}`)) for (let y = 0; y < 2; y++) wall[y0 + y][x0 + 2] = false;
    if (open.has(`${c},${r}|${c},${r + 1}`)) for (let x = 0; x < 2; x++) wall[y0 + 2][x0 + x] = false;
  }
  // distances from the start cell
  const dist = new Map<string, number>([['0,0', 0]]);
  const prev = new Map<string, string>();
  const q: Cell[] = [{ c: 0, r: 0 }];
  while (q.length) {
    const cur = q.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { c: cur.c + dc, r: cur.r + dr };
      const k = `${n.c},${n.r}`;
      if (dist.has(k) || !open.has(`${cur.c},${cur.r}|${k}`)) continue;
      dist.set(k, dist.get(`${cur.c},${cur.r}`)! + 1); prev.set(k, `${cur.c},${cur.r}`); q.push(n);
    }
  }
  const farthest = [...dist.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const path: string[] = [];
  for (let k: string | undefined = farthest; k; k = prev.get(k)) path.unshift(k);
  // the seal room: a dead end off the main path, as far in as possible
  const deg = (k: string) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dc, dr]) => { const [c, r] = k.split(',').map(Number); return open.has(`${k}|${c + dc},${r + dr}`); }).length;
  const onPath = new Set(path);
  const seal = [...dist.entries()].filter(([k]) => !onPath.has(k) && deg(k) === 1).sort((a, b) => b[1] - a[1])[0]?.[0] ?? path[Math.floor(path.length / 2)];
  return { wall, path, exit: farthest, seal, prev };
}

const cellCentre = (k: string) => { const [c, r] = k.split(',').map(Number); return { x: (c * CELL + 2) * T, y: (r * CELL + 2) * T }; };

export class TunnelScene extends WorldScene {
  private dark!: Darkness;
  private patrols: Patrol[] = [];
  private wall: boolean[][] = [];
  private torches: Array<{ x: number; y: number }> = [];

  constructor() {
    super('tunnels');
  }

  protected build(): Arrival {
    const save = loadMystery();
    const maze = buildMaze();
    this.wall = maze.wall;
    const W = TW * T, H = TH * T;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor('#050304').setBounds(0, 0, W, H);

    // paint the tunnels once
    if (!this.textures.exists('tunnel-map')) {
      const tex = this.textures.createCanvas('tunnel-map', W, H)!;
      const c = tex.getContext();
      let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
        if (this.wall[y][x]) {
          c.fillStyle = '#2a2430'; c.fillRect(x * T, y * T, T, T);
          c.fillStyle = '#3a3440';
          for (let by = 0; by < 4; by++) for (let bx = 0; bx < 2; bx++) c.fillRect(x * T + bx * 16 + (by % 2) * 8 + 1, y * T + by * 8 + 1, 14, 6);
          if (y + 1 < TH && !this.wall[y + 1][x]) { c.fillStyle = '#1a1620'; c.fillRect(x * T, y * T + T - 6, T, 6); }
        } else {
          c.fillStyle = '#4a4038'; c.fillRect(x * T, y * T, T, T);
          for (let k = 0; k < 6; k++) { c.fillStyle = rnd() < 0.5 ? '#3e352e' : '#564a40'; c.fillRect(x * T + rnd() * 30, y * T + rnd() * 30, 3, 2); }
        }
      }
      tex.refresh();
    }
    this.add.image(0, 0, 'tunnel-map').setOrigin(0).setDepth(-1000);
    for (let y = 0; y < TH; y++) {
      let run = -1;
      for (let x = 0; x <= TW; x++) {
        const w = x < TW && this.wall[y][x];
        if (w && run < 0) run = x;
        if (!w && run >= 0) { this.solid(run * T, y * T, (x - run) * T, T); run = -1; }
      }
    }

    // torches every so often along the main path
    this.torches = maze.path.filter((_, i) => i % 6 === 3).map(cellCentre);
    for (const t of this.torches) this.add.sprite(t.x + 20, t.y - 8, 'hm-brazier', 0).setScale(0.6).setDepth(t.y).play('hm-brazier-burn');

    // the way back up
    const start = cellCentre('0,0');
    this.place('hm-ladder', start.x - 16, start.y - 6, [10, 6]);
    this.interactables.push({ id: 'up', at: { x: start.x - 16, y: start.y + 4 }, who: 'Touwladder', lines: [], action: () => this.travel('manor-grounds', { x: 19.5 * T, y: 10.6 * T, facing: 'down' }) });

    // the seal room behind a riddle door
    const sr = cellCentre(maze.seal);
    const [sc, srow] = maze.seal.split(',').map(Number);
    const from = maze.prev.get(maze.seal)!;
    const [fc, fr] = from.split(',').map(Number);
    const door = { x: (sr.x + cellCentre(from).x) / 2, y: (sr.y + cellCentre(from).y) / 2 };
    const doorZone = this.solid(door.x - (fc !== sc ? 16 : 32), door.y - (fr !== srow ? 16 : 32), fc !== sc ? 32 : 64, fr !== srow ? 32 : 64);
    const doorImg = this.add.image(door.x, door.y + 30, 'hm-moondoor', 0).setOrigin(0.5, 1).setScale(0.8).setTint(0xc8a878).setDepth(door.y + 30);
    const opened = () => { doorImg.setAlpha(0.15); (doorZone.body as Phaser.Physics.Arcade.StaticBody).enable = false; };
    if (save.riddle) opened();
    this.interactables.push({
      id: 'riddle', at: { x: door.x + (fc - sc) * 24, y: door.y + (fr - srow) * 24 + 10 }, who: 'Raadseldeur', lines: [], action: () => {
        if (loadMystery().riddle) { this.say('Raadseldeur', ['De deur staat open.']); return; }
        this.say('Raadseldeur', TUNNELS.riddleDoor, () => askChoice('Het raadsel', 'Hoe meer je ervan weghaalt, hoe groter het wordt. Wat ben ik?', ['Een schaduw', 'Een gat', 'Een geheim', 'Een kaars'], (i) => {
          if (i < 0) return;
          if (i !== 1) { this.say('Raadseldeur', TUNNELS.riddleWrong); return; }
          const m = loadMystery(); m.riddle = true; saveMystery(m);
          this.cameras.main.shake(300, 0.005);
          opened();
          this.say('Raadseldeur', TUNNELS.riddleRight);
        }));
      },
    });
    if (!save.seal4) {
      const s4 = this.add.image(sr.x, sr.y, 'hm-seal-stag').setScale(0.8).setDepth(sr.y);
      this.tweens.add({ targets: s4, y: sr.y - 3, yoyo: true, repeat: -1, duration: 1000 });
      this.torches.push(sr);
      const it = {
        id: 'seal4', at: { x: sr.x, y: sr.y + 14 }, who: 'Het vierde zegel', lines: [] as string[], action: () => {
          const m = loadMystery(); if (m.seal4) return;
          m.seal4 = true; saveMystery(m);
          this.tweens.add({ targets: s4, alpha: 0, y: s4.y - 30, duration: 800 });
          it.at.y = -9999;
          this.say('Het vierde zegel', TUNNELS.sealFound);
        },
      };
      this.interactables.push(it);
    }

    // the star door at the far end
    const ex = cellCentre(maze.exit);
    this.add.image(ex.x, ex.y + 24, 'hm-moondoor', 1).setOrigin(0.5, 1).setTint(0xffe2a0).setDepth(ex.y + 24);
    this.torches.push(ex);
    this.interactables.push({
      id: 'stardoor', at: { x: ex.x, y: ex.y + 30 }, who: 'Sterrendeur', lines: [], action: () => {
        const m = loadMystery();
        const n = [m.seal1, m.seal2, m.seal3, m.seal4].filter(Boolean).length;
        if (n < 4) { this.say('Sterrendeur', [...TUNNELS.starDoor, ...TUNNELS.starDoorLocked(n)]); return; }
        this.say('Sterrendeur', [...TUNNELS.starDoor, 'Je drukt de vier zegels in de holtes. Ze passen precies. De deur rolt open...'], () => this.travel('starchamber', { x: 320, y: 380, facing: 'up' }));
      },
    });

    // the Lantaarnkring on patrol, along stretches of the main path
    this.patrols = [];
    if (!save.finale) {
      const blocked = (x: number, y: number) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return ty < 0 || tx < 0 || ty >= TH || tx >= TW || this.wall[ty][tx]; };
      const n = maze.path.length;
      for (const [a, b] of [[0.25, 0.45], [0.55, 0.75], [0.8, 0.95]]) {
        const seg = maze.path.slice(Math.floor(n * a), Math.max(Math.floor(n * a) + 2, Math.floor(n * b))).map(cellCentre);
        const route = [...seg, ...seg.slice(1, -1).reverse()].map((p, i, arr) => ({ ...p, wait: i === 0 || i === Math.floor(arr.length / 2) ? 1.2 : undefined }));
        this.patrols.push(new Patrol(this, route, { speed: 46, len: 130, blocked }));
      }
    }

    this.dark = new Darkness(this, 0.95);
    if (!save.seal4) this.time.delayedCall(500, () => this.say('Tunnels', TUNNELS.enter));
    return { x: start.x + 8, y: start.y + 20, facing: 'down' };
  }

  protected tick() {
    const p = this.player;
    if (!p) return;
    const dt = this.game.loop.delta / 1000;
    const playing = this.registry.get('started') && !this.dialog.isOpen;
    for (const pat of this.patrols) {
      if (pat.update(dt, p.x, p.y - 20) && playing) this.caught();
    }
    this.dark.update([
      { x: p.x, y: p.y - 20, size: 1.05 },
      ...this.torches.map((t) => ({ ...t, size: 0.55 })),
      ...this.patrols.map((q) => ({ x: q.x, y: q.y - 20, size: 0.6 })),
    ]);
  }

  private caught() {
    const m = loadMystery(); m.tunnelCaught = (m.tunnelCaught ?? 0) + 1; saveMystery(m);
    for (const q of this.patrols) q.grace = 3;
    this.player.halt();
    this.cameras.main.shake(200, 0.006);
    this.say('Lantaarnkring', TUNNELS.caught[(m.tunnelCaught - 1) % TUNNELS.caught.length], () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const s = cellCentre('0,0');
        this.player.setPosition(s.x + 8, s.y + 20);
        this.cameras.main.fadeIn(300);
      });
    });
  }
}
