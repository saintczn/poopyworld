import Phaser from 'phaser';
import { TILE, INTERACT_RANGE } from '../config';
import { sprites } from '../assets';
import * as G from '../content/villaGarden';
import { paintGround } from '../world/ground';
import { Player } from '../entities/Player';
import { Dialog } from '../ui/dialog';

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;

const T = TILE;

/** The villa garden: the first playable area. */
export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Keys;
  private hint!: Phaser.GameObjects.Image;
  private dialog = new Dialog();
  private nearby: G.Interactable | null = null;
  /** Set by key presses, so even a very quick tap is never missed. */
  private interactPressed = false;
  private escapePressed = false;

  constructor() {
    super('garden');
  }

  create() {
    const worldW = G.MAP_W * T, worldH = G.MAP_H * T;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.solids = this.physics.add.staticGroup();

    paintGround(this, 'garden-ground', { w: G.MAP_W, h: G.MAP_H, dirt: G.dirt, pond: G.pond, soil: G.soil, seed: 21 });
    this.add.image(0, 0, 'garden-ground').setOrigin(0).setDepth(-1000);

    this.buildPond();
    this.buildHouse();
    this.buildFences();
    this.buildNature();
    this.buildProps();
    this.buildBorders();

    this.player = new Player(this, G.spawn.x, G.spawn.y, this.registry.get('lookKey'));
    this.physics.add.collider(this.player, this.solids);

    this.hint = this.add.image(0, 0, 'key-e').setOrigin(0.5, 1).setDepth(100000).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player, true, 0.14, 0.14);
    cam.setRoundPixels(true);
    cam.setBackgroundColor('#2d4a2b');

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Keys;
    const kb = this.input.keyboard!;
    const press = () => { this.interactPressed = true; };
    kb.on('keydown-E', press);
    kb.on('keydown-SPACE', press);
    kb.on('keydown-ENTER', press);
    kb.on('keydown-ESC', () => { this.escapePressed = true; });
    kb.on('keydown-C', () => {
      if (this.registry.get('started') && !this.dialog.isOpen) { this.player.halt(); this.game.events.emit('open-creator'); }
    });

    // Debug helper for screenshots: ?at=x,y puts the player there.
    const at = new URLSearchParams(location.search).get('at');
    if (at) {
      const [x, y] = at.split(',').map(Number);
      this.player.setPosition(x, y);
      cam.centerOn(x, y);
    }
  }

  setPlayerLook(key: string) {
    this.player.setLook(key);
  }

  // ---------- helpers ----------

  /** An invisible wall. x, y, w, h in pixels (top-left). */
  private solid(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solids.add(z);
  }

  /** A named sprite with its feet at (x, y) pixels, sorted by depth, with an optional solid base. */
  private place(name: string, x: number, y: number, solid?: [number, number], flip = false) {
    const def = sprites[name];
    const img = def ? this.add.image(x, y, def[0], name) : this.add.image(x, y, name);
    img.setOrigin(0.5, 1).setDepth(y).setFlipX(flip);
    if (solid) this.solid(x - solid[0] / 2, y - solid[1], solid[0], solid[1]);
    return img;
  }

  // ---------- building the garden ----------

  private buildPond() {
    const p = G.pond;
    // The water (inner area) blocks walking; the banks are walkable.
    this.solid((p.x + 0.55) * T, (p.y + 0.6) * T, (p.w - 1.1) * T, (p.h - 1.1) * T);
    for (const [key, x, y] of G.pondDecor) {
      this.add.image(x * T, y * T, sprites[key][0], key).setOrigin(0.5, 1).setDepth(-500);
    }
    for (const [key, x, y] of G.crops) this.place(key, x * T, y * T);
  }

  private buildHouse() {
    const { x, y } = G.house;
    this.add.image(x, y, 'house', 'house').setOrigin(0).setDepth(y + 192);
    // Walls (the stairs at the front door stay walkable).
    this.solid(x + 32, y + 100, 128, 76);
    this.solid(x + 32, y + 176, 32, 16);
    this.solid(x + 96, y + 176, 64, 16);
    this.solid(x + 160, y + 70, 64, 90);
    this.solid(x + 22, y + 60, 10, 120);
  }

  private fenceH(tx: number, ty: number, end: boolean) {
    this.add.image(tx * T, ty * T, 'fence', end ? 'fence-h-end' : 'fence-h').setOrigin(0).setDepth(ty * T + 28);
  }

  private fenceV(tx: number, ty: number, frame: 'top' | 'mid' | 'post' | 'bottom') {
    this.add.image(tx * T, ty * T, 'fence', `fence-v-${frame}`).setOrigin(0).setDepth(ty * T + 30);
  }

  /** Horizontal fence from tile x0 to x1 (inclusive) on row ty. */
  private fenceRun(x0: number, x1: number, ty: number) {
    for (let x = x0; x <= x1; x++) this.fenceH(x, ty, x === x1);
    this.solid(x0 * T + 10, ty * T + 18, (x1 - x0) * T + 12, 12);
  }

  /** Vertical fence on column tx from tile y0 to y1 (inclusive). */
  private fenceCol(tx: number, y0: number, y1: number) {
    for (let y = y0; y <= y1; y++) {
      const f = y === y0 ? 'top' : y === y1 ? 'bottom' : (y - y0) % 3 === 0 ? 'post' : 'mid';
      this.fenceV(tx, y, f);
    }
    this.solid(tx * T + 10, y0 * T, 12, (y1 - y0 + 1) * T);
  }

  private buildFences() {
    const g = G.goatPen;
    const x1 = g.x + g.w - 1, y1 = g.y + g.h - 1;
    this.fenceRun(g.x, x1, g.y);
    this.fenceRun(g.x, x1, y1);
    this.fenceCol(g.x, g.y + 1, g.openingY - 1);
    this.fenceCol(g.x, g.openingY + g.openingH, y1 - 1);
    this.fenceCol(x1, g.y + 1, y1 - 1);

    // Garden fence along the bottom, with the gate gap.
    const b = G.bottomFence;
    this.fenceRun(1, b.gapX - 1, b.y);
    this.fenceRun(b.gapX + b.gapW, G.MAP_W - 2, b.y);
  }

  private buildNature() {
    for (const [key, x, y] of G.trees) {
      const px = x * T, py = y * T;
      const pine = key.startsWith('pine');
      this.add.image(px, py - 4, 'trees', pine ? 'shadow-pine' : 'shadow-tree').setOrigin(0.5, 0.5).setAlpha(0.3).setDepth(-400);
      this.place(key, px, py, [22, 10]);
    }
    for (const [key, x, y] of G.flowers) this.place(key, x * T, y * T);
  }

  private buildProps() {
    for (const p of G.props) {
      const img = this.place(p.key, p.x * T, p.y * T, p.solid, p.flip);
      if (p.anim) (this.add.sprite(img.x, img.y, 'campfire').setOrigin(0.5, 1).setDepth(img.depth).play(p.anim), img.destroy());
    }
    for (const h of G.handmade) {
      const px = h.x * T, py = h.y * T;
      if (h.anim) this.add.sprite(px, py, h.key).setOrigin(0.5, 1).setDepth(py).play(h.anim);
      else this.add.image(px, py, h.key).setOrigin(0.5, 1).setDepth(py);
      if (h.solid) this.solid(px - h.solid[0] / 2, py - h.solid[1], h.solid[0], h.solid[1]);
    }
  }

  /** Keeps the player out of the forest edges. */
  private buildBorders() {
    const W = G.MAP_W * T, H = G.MAP_H * T;
    this.solid(0, 0, W, 2.6 * T);
    this.solid(0, 0, 1.7 * T, H);
    this.solid(W - 1.6 * T, 0, 1.6 * T, H);
    // Road to Heartwood is closed for now.
    this.solid(G.bottomFence.gapX * T, H - 0.8 * T, G.bottomFence.gapW * T, 0.8 * T);
  }

  // ---------- every frame ----------

  update(time: number) {
    if (!this.registry.get('started')) { this.interactPressed = false; return; }
    const k = this.keys;
    const interact = this.interactPressed;
    const escape = this.escapePressed;
    this.interactPressed = false;
    this.escapePressed = false;

    if (this.dialog.isOpen) {
      this.player.halt();
      this.hint.setVisible(false);
      if (escape) this.dialog.close();
      else if (interact) this.dialog.advance();
      return;
    }

    const dx = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0);
    const dy = (k.UP.isDown || k.W.isDown ? -1 : 0) + (k.DOWN.isDown || k.S.isDown ? 1 : 0);
    this.player.move(dx, dy);

    this.nearby = this.findNearby();
    const bob = Math.sin(time / 180) > 0 ? -1 : 0;
    this.hint
      .setVisible(this.nearby !== null)
      .setPosition(Math.round(this.player.x), Math.round(this.player.y) - 52 + bob);

    if (interact && this.nearby) {
      this.player.halt();
      this.dialog.open(this.nearby.who, this.nearby.lines);
    }
  }

  private findNearby(): G.Interactable | null {
    const look = this.player.lookPoint();
    let best: G.Interactable | null = null;
    let bestD = INTERACT_RANGE;
    for (const it of G.interactables) {
      const d = Math.min(
        Phaser.Math.Distance.Between(look.x, look.y, it.at.x, it.at.y),
        Phaser.Math.Distance.Between(this.player.x, this.player.y - 4, it.at.x, it.at.y) + 6,
      );
      if (d < bestD) { bestD = d; best = it; }
    }
    return best;
  }
}
