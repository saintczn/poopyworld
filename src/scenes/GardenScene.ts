import Phaser from 'phaser';
import { TILE, INTERACT_RANGE } from '../config';
import {
  MAP_WIDTH, MAP_HEIGHT, Ground, groundAreas, groundExceptions, gate, goatPen,
  trees, bushes, interactables, spawn, type Interactable,
} from '../content/villaGarden';
import { Player } from '../entities/Player';
import { Dialog } from '../ui/dialog';

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'E' | 'SPACE' | 'ENTER' | 'ESC', Phaser.Input.Keyboard.Key>;

/** The villa garden: the first playable area. */
export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Keys;
  private hint!: Phaser.GameObjects.Image;
  private dialog = new Dialog();
  private nearby: Interactable | null = null;
  /** Set by key presses, so even a very quick tap is never missed. */
  private interactPressed = false;
  private escapePressed = false;

  constructor() {
    super('garden');
  }

  create() {
    const worldW = MAP_WIDTH * TILE, worldH = MAP_HEIGHT * TILE;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.add.image(0, 0, 'ground').setOrigin(0).setDepth(-10);
    this.solids = this.physics.add.staticGroup();

    this.buildWaterCollision();
    this.buildFences();
    this.buildScenery();

    this.player = new Player(this, spawn.x, spawn.y, 'player-1');
    this.physics.add.collider(this.player, this.solids);

    this.hint = this.add.image(0, 0, 'key-e').setOrigin(0.5, 1).setDepth(100000).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setRoundPixels(true);
    cam.setBackgroundColor('#1b2a24');

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ENTER,ESC') as Keys;
    const kb = this.input.keyboard!;
    const press = () => { this.interactPressed = true; };
    kb.on('keydown-E', press);
    kb.on('keydown-SPACE', press);
    kb.on('keydown-ENTER', press);
    this.game.events.on('touch-interact', press);
    kb.on('keydown-ESC', () => { this.escapePressed = true; });
  }

  // ---------- building the garden ----------

  /** An invisible wall. x, y, w, h in pixels (top-left). */
  private solid(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solids.add(z);
  }

  private buildWaterCollision() {
    const water = new Set<string>();
    for (const a of groundAreas) {
      if (a.type !== Ground.Water) continue;
      for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) water.add(`${x},${y}`);
    }
    for (const e of groundExceptions) water.delete(`${e.x},${e.y}`);
    for (const key of water) {
      const [x, y] = key.split(',').map(Number);
      this.solid(x * TILE + 1, y * TILE + 2, TILE - 2, TILE - 3);
    }
  }

  private fenceH(tx: number, ty: number) {
    this.add.image(tx * TILE, ty * TILE, 'fence-h').setOrigin(0).setDepth(ty * TILE + 14);
  }

  private fenceV(tx: number, ty: number) {
    this.add.image(tx * TILE, ty * TILE, 'fence-v').setOrigin(0).setDepth(ty * TILE + 16);
  }

  private buildFences() {
    const W = MAP_WIDTH, H = MAP_HEIGHT;
    // Garden border
    for (let x = 0; x < W; x++) this.fenceH(x, 0);
    for (let x = 0; x < W; x++) if (x < gate.x || x >= gate.x + gate.w) this.fenceH(x, H - 1);
    for (let y = 1; y < H - 1; y++) { this.fenceV(0, y); this.fenceV(W - 1, y); }
    this.solid(0, 0, W * TILE, 14);
    this.solid(0, (H - 1) * TILE + 6, W * TILE, 10); // also closes the gate for now
    this.solid(0, 0, 11, H * TILE);
    this.solid((W - 1) * TILE + 5, 0, 11, H * TILE);

    // Goat meadow
    const g = goatPen;
    for (let x = g.x; x < g.x + g.w; x++) { this.fenceH(x, g.y); this.fenceH(x, g.y + g.h - 1); }
    for (let y = g.y + 1; y < g.y + g.h - 1; y++) {
      if (y < g.openingY || y >= g.openingY + g.openingH) this.fenceV(g.x, y);
      this.fenceV(g.x + g.w - 1, y);
    }
    this.solid(g.x * TILE, g.y * TILE + 6, g.w * TILE, 9);
    this.solid(g.x * TILE, (g.y + g.h - 1) * TILE + 6, g.w * TILE, 9);
    this.solid(g.x * TILE + 5, (g.y + 1) * TILE, 6, (g.openingY - g.y - 1) * TILE);
    const below = g.openingY + g.openingH;
    this.solid(g.x * TILE + 5, below * TILE, 6, (g.y + g.h - 1 - below) * TILE);
    this.solid((g.x + g.w - 1) * TILE + 5, (g.y + 1) * TILE, 6, (g.h - 2) * TILE);
  }

  /** Places an image with its feet at (x, y) and a small solid base. */
  private prop(key: string, x: number, y: number, baseW: number, baseH: number) {
    const img = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    if (baseW > 0) this.solid(x - baseW / 2, y - baseH, baseW, baseH);
    return img;
  }

  private buildScenery() {
    // The villa (14 x 9 tiles). Walls are solid; you can walk right up to the front door.
    this.add.image(13 * TILE, 2 * TILE, 'villa').setOrigin(0).setDepth(2 * TILE + 144);
    this.solid(13 * TILE + 6, 2 * TILE + 66, 14 * TILE - 12, 74);

    for (const [tx, ty] of trees) this.prop('tree', tx * TILE + 8, ty * TILE + 16, 10, 6);
    for (const [tx, ty] of bushes) this.prop('bush', tx * TILE + 8, ty * TILE + 15, 12, 5);

    const ng = this.prop('flag-ng', 232, 192, 4, 3);
    const nl = this.prop('flag-nl', 408, 192, 4, 3);
    this.anims.create({ key: 'wave-ng', frames: [{ key: 'flag-ng', frame: 0 }, { key: 'flag-ng', frame: 1 }], frameRate: 3, repeat: -1 });
    this.anims.create({ key: 'wave-nl', frames: [{ key: 'flag-nl', frame: 0 }, { key: 'flag-nl', frame: 1 }], frameRate: 3, repeat: -1 });
    this.add.sprite(ng.x, ng.y, 'flag-ng').setOrigin(0.5, 1).setDepth(ng.depth).play('wave-ng');
    this.add.sprite(nl.x, nl.y, 'flag-nl').setOrigin(0.5, 1).setDepth(nl.depth).play({ key: 'wave-nl', startFrame: 1 });
    ng.destroy(); nl.destroy();

    this.prop('mailbox', 354, 214, 6, 3);
    this.prop('perch', 456, 162, 14, 4);
    this.prop('dining', 136, 140, 44, 12);
    this.prop('sign', 436, 270, 4, 3);
    this.prop('shelter', 548, 262, 34, 10);
    this.prop('sign', 350, 466, 4, 3);
  }

  // ---------- every frame ----------

  update(time: number) {
    if (!this.registry.get('started')) { this.interactPressed = false; return; }
    const k = this.keys;
    const interact = this.interactPressed || Boolean(this.registry.get('touch-interact'));
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

    const dx = (k.LEFT.isDown || k.A.isDown || this.registry.get('touch-left') ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown || this.registry.get('touch-right') ? 1 : 0);
    const dy = (k.UP.isDown || k.W.isDown || this.registry.get('touch-up') ? -1 : 0) + (k.DOWN.isDown || k.S.isDown || this.registry.get('touch-down') ? 1 : 0);
    this.player.move(dx, dy);

    this.nearby = this.findNearby();
    const bob = Math.sin(time / 180) > 0 ? -1 : 0;
    this.hint
      .setVisible(this.nearby !== null)
      .setPosition(Math.round(this.player.x), Math.round(this.player.y) - 26 + bob);

    if (interact && this.nearby) {
      this.player.halt();
      this.dialog.open(this.nearby.who, this.nearby.lines);
    }
  }

  private findNearby(): Interactable | null {
    const look = this.player.lookPoint();
    let best: Interactable | null = null;
    let bestD = INTERACT_RANGE;
    for (const it of interactables) {
      const d = Math.min(
        Phaser.Math.Distance.Between(look.x, look.y, it.at.x, it.at.y),
        Phaser.Math.Distance.Between(this.player.x, this.player.y - 3, it.at.x, it.at.y) + 4,
      );
      if (d < bestD) { bestD = d; best = it; }
    }
    return best;
  }
}
