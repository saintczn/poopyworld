import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { paintRoom, roomWalls, type RoomSpec } from '../world/room';
import { loadMystery, saveMystery, CELLAR, PAGES2, SEAL2_FOUND } from '../content/mystery';

/**
 * The cellar under Hollowmere. Pitch dark except for your lantern.
 * A fire bowl casts a beam of light; turn the mirrors so the beam reaches the moon on the stone door.
 */
const SPEC: RoomSpec = {
  key: 'cellar-room', map: { w: 768, h: 448 }, room: { x: 32, y: 128, w: 704, h: 256 }, wallTop: 32,
  door: { x: 96, w: 64 }, floorCol: 1, floorRow: 3, wallBlock: 384, band: [0x2a2430, 0x3a3440, 0x120e16],
};

// the puzzle grid: 48 px cells
const CELL = 48, GX = 48, GY = 158, COLS = 13, ROWS = 5;
const SOURCE = { c: -1, r: 1 };
const TARGET = { c: 13, r: 0 };
type Mirror = { c: number; r: number; slash: boolean; img: Phaser.GameObjects.Image };
// the starting orientation of each mirror (the right answer is A \, B \, C /, D /)
const MIRRORS: Array<[number, number, boolean]> = [[3, 1, true], [3, 4, true], [8, 4, false], [8, 0, false], [6, 2, true], [11, 3, false], [5, 0, false]];

const cx = (c: number) => GX + c * CELL + CELL / 2;
const cy = (r: number) => GY + r * CELL + CELL / 2;

export class CellarScene extends WorldScene {
  private dark!: Phaser.GameObjects.RenderTexture;
  private stamp!: Phaser.GameObjects.Image;
  private small!: Phaser.GameObjects.Image;
  private beam!: Phaser.GameObjects.Graphics;
  private mirrors: Mirror[] = [];
  private door!: Phaser.GameObjects.Sprite;
  private solved = false;
  private seal?: Phaser.GameObjects.Image;
  private beamEnd = { x: 0, y: 0 };

  constructor() {
    super('cellar');
  }

  protected build(): Arrival {
    const save = loadMystery();
    this.mirrors = [];
    this.solved = !!save.seal2;
    this.physics.world.setBounds(0, 0, SPEC.map.w, SPEC.map.h);
    this.cameras.main.setBackgroundColor('#050306').setBounds(0, -20, SPEC.map.w, SPEC.map.h + 20);
    paintRoom(this, SPEC);
    roomWalls(this, SPEC, (x, y, w, h) => this.solid(x, y, w, h));

    // stairs going up
    this.add.image(SPEC.door.x, SPEC.room.y + SPEC.room.h - 4, 'hm-trapdoor', 1).setDepth(-400).setFlipY(true);
    // the fire bowl that makes the beam
    const bx = cx(SOURCE.c) + 6, by = cy(SOURCE.r);
    this.add.sprite(bx, by + 18, 'hm-brazier', 0).setOrigin(0.5, 1).setDepth(by + 18).play('hm-brazier-burn');
    this.solid(bx - 12, by + 6, 24, 12);
    this.interactables.push({ id: 'brazier', at: { x: bx + 20, y: by + 22 }, who: 'Vuurschaal', lines: CELLAR.brazier });

    // the stone door with the moon, and the niche behind it
    const dx = cx(TARGET.c), dy = cy(TARGET.r);
    this.add.rectangle(dx, dy + 6, 56, 70, 0x0c0810).setDepth(dy - 10);
    this.door = this.add.sprite(dx, dy + 40, 'hm-moondoor', this.solved ? 1 : 0).setOrigin(0.5, 1).setDepth(dy + 40);
    if (this.solved) this.door.setAlpha(0);
    const doorZone = this.solid(dx - 30, dy + 20, 60, 20);
    if (this.solved) (doorZone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.interactables.push({ id: 'moondoor', at: { x: dx - 34, y: dy + 34 }, who: 'Stenen deur', lines: [], action: () => this.say('Stenen deur', this.solved ? CELLAR.doorOpen : CELLAR.doorClosed) });
    if (!save.seal2) {
      this.seal = this.add.image(dx, dy + 8, 'hm-seal-owl').setScale(0.7).setDepth(dy - 5).setVisible(false);
      this.interactables.push({ id: 'seal2', at: { x: -9999, y: -9999 }, who: 'Het tweede zegel', lines: [], action: () => this.takeSeal() });
    }

    // the mirrors
    for (const [c, r, slash] of MIRRORS) {
      const img = this.add.image(cx(c), cy(r) + 18, 'hm-mirror', slash ? 0 : 1).setOrigin(0.5, 1).setDepth(cy(r) + 18);
      const m: Mirror = { c, r, slash: this.solved ? this.answer(c, r, slash) : slash, img };
      img.setFrame(m.slash ? 0 : 1);
      this.mirrors.push(m);
      this.solid(cx(c) - 10, cy(r) + 8, 20, 10);
      this.interactables.push({ id: `mirror-${c}-${r}`, at: { x: cx(c), y: cy(r) + 28 }, who: 'Spiegel', lines: [], action: () => this.turn(m) });
    }

    // the cellar itself: barrels, crates, cobwebs, two journal pages
    this.place('barrels', 680, 360, [40, 14]);
    this.place('crates', 200, 360, [30, 12]);
    this.place('barrels', 420, 150, [40, 14]);
    this.add.image(32, 128, 'hm-cobweb').setOrigin(0).setDepth(60);
    this.add.image(736, 128, 'hm-cobweb').setOrigin(0).setFlipX(true).setDepth(60).setX(704);
    const spots = [{ x: 250, y: 352 }, { x: 640, y: 370 }];
    PAGES2.forEach((pg, i) => {
      this.add.image(spots[i].x, spots[i].y, 'journal').setDepth(spots[i].y);
      this.interactables.push({ id: `page2-${i}`, at: { x: spots[i].x, y: spots[i].y + 8 }, who: pg.who, lines: pg.lines });
    });

    // the beam and the darkness
    this.beam = this.add.graphics().setDepth(95002).setBlendMode(Phaser.BlendModes.ADD);
    this.dark = this.add.renderTexture(0, 0, 640, 360).setOrigin(0).setScrollFactor(0).setDepth(95000);
    this.stamp = this.make.image({ key: 'glow', add: false }).setScale(2.1);
    this.small = this.make.image({ key: 'glow', add: false }).setScale(0.9);
    this.traceBeam();

    if (!save.seal2) this.time.delayedCall(500, () => this.say('Kelder', CELLAR.enter));
    return { x: SPEC.door.x, y: SPEC.room.y + SPEC.room.h - 20, facing: 'up' };
  }

  /** The orientation each mirror needs (decoys keep their own). */
  private answer(c: number, r: number, slash: boolean) {
    const key = `${c},${r}`;
    const right: Record<string, boolean> = { '3,1': false, '3,4': false, '8,4': true, '8,0': true };
    return key in right ? right[key] : slash;
  }

  private turn(m: Mirror) {
    if (this.solved) { this.say('Spiegel', ['De spiegels staan goed. Het licht valt precies op de maan.']); return; }
    m.slash = !m.slash;
    m.img.setFrame(m.slash ? 0 : 1);
    this.tweens.add({ targets: m.img, scaleX: { from: 0.7, to: 1 }, duration: 160 });
    this.traceBeam();
  }

  /** Follows the light from the fire bowl, cell by cell, bouncing off mirrors. */
  private traceBeam() {
    let c = SOURCE.c, r = SOURCE.r, dc = 1, dr = 0;
    const pts: Array<{ x: number; y: number }> = [{ x: cx(c) + 14, y: cy(r) - 10 }];
    let hit = false;
    for (let i = 0; i < 80; i++) {
      c += dc; r += dr;
      if (c === TARGET.c && r === TARGET.r) { pts.push({ x: cx(c) - 4, y: cy(r) - 10 }); hit = true; break; }
      if (c < 0 || c > COLS || r < 0 || r >= ROWS) {
        pts.push({ x: cx(c) - dc * CELL / 2, y: cy(r) - dr * CELL / 2 - 10 });
        break;
      }
      const m = this.mirrors.find((mm) => mm.c === c && mm.r === r);
      if (m) {
        pts.push({ x: cx(c), y: cy(r) - 10 });
        [dc, dr] = m.slash ? [-dr, -dc] : [dr, dc];
      }
    }
    const g = this.beam; g.clear();
    for (const [w, col, a] of [[9, 0xff8a2a, 0.35], [4, 0xffd27a, 0.8], [1.5, 0xffffff, 1]] as const) {
      g.lineStyle(w, col, a);
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.strokePath();
    }
    this.beamEnd = pts[pts.length - 1];
    if (hit && !this.solved) this.solve();
  }

  private solve() {
    this.solved = true;
    this.cameras.main.shake(500, 0.006);
    this.door.setFrame(1);
    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: this.door, y: this.door.y + 24, alpha: 0, duration: 1400, ease: 'Sine.easeIn', onComplete: () => {
        const z = this.solids.getChildren().find((s) => Math.abs((s as Phaser.GameObjects.Zone).x - cx(TARGET.c)) < 4) as Phaser.GameObjects.Zone | undefined;
        if (z) (z.body as Phaser.Physics.Arcade.StaticBody).enable = false;
        if (this.seal) {
          this.seal.setVisible(true);
          this.tweens.add({ targets: this.seal, y: this.seal.y - 3, yoyo: true, repeat: -1, duration: 1000 });
          const it = this.interactables.find((i) => i.id === 'seal2');
          if (it) { it.at.x = cx(TARGET.c); it.at.y = cy(TARGET.r) + 30; }
        }
      } });
      this.say('Stenen deur', ['Het licht valt op de maan... die begint zilver te gloeien!', 'Met een diep gerommel zakt de stenen deur de vloer in.']);
    });
  }

  private takeSeal() {
    const m = loadMystery();
    if (m.seal2 || !this.seal) return;
    m.seal2 = true; saveMystery(m);
    this.tweens.add({ targets: this.seal, y: this.seal.y - 30, alpha: 0, duration: 900 });
    this.interactables.find((i) => i.id === 'seal2')!.at.y = -9999;
    this.say('Het tweede zegel', SEAL2_FOUND, () => this.banner('Hoofdstuk 2 voltooid\nDe Lantaarnkring', 'Twee van de vier zegels.\nWordt vervolgd: De Klokkentoren', '#d8e0ff'));
  }

  protected tick() {
    // darkness, with holes for your lantern, the fire bowl, the beam's end and the moon
    const cam = this.cameras.main;
    const sx = (x: number) => x - cam.scrollX, sy = (y: number) => y - cam.scrollY;
    this.dark.clear();
    this.dark.fill(0x000000, 0.93);
    if (this.player) {
      const flick = 1 + Math.sin(this.time.now / 120) * 0.03;
      this.stamp.setScale(2.1 * flick);
      this.dark.erase(this.stamp, sx(this.player.x), sy(this.player.y - 20));
    }
    this.dark.erase(this.small, sx(cx(SOURCE.c)), sy(cy(SOURCE.r)));
    this.dark.erase(this.small, sx(this.beamEnd.x), sy(this.beamEnd.y));
    if (this.solved) this.dark.erase(this.small, sx(cx(TARGET.c)), sy(cy(TARGET.r) + 10));
    // leaving by the stairs
    if (this.registry.get('started') && this.player && this.player.y > SPEC.room.y + SPEC.room.h + 8) {
      this.travel('manor', { x: 540, y: 300, facing: 'down' });
    }
  }
}

