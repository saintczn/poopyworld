import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, type LightSpot } from '../world/ambient';
import { paintRoom, roomWalls, type RoomSpec } from '../world/room';
import { loadMystery, saveMystery, PAGES, SEAL_FOUND } from '../content/mystery';

/**
 * Inside Hollowmere Manor. The hall (left) and Odile's study (right) are split by a wall with an iron gate.
 * The gate opens while something heavy stands on the stone plate in front of it (one of you, or the crate).
 * In the study one golden book opens a hidden alcove with the first seal.
 */
const SPEC: RoomSpec = {
  key: 'manor-room', map: { w: 768, h: 448 }, room: { x: 32, y: 128, w: 704, h: 256 }, wallTop: 32,
  door: { x: 224, w: 64 }, floorCol: 1, floorRow: 3, wallBlock: 384, band: [0x3a3448, 0x5a5468, 0x1a1624],
};
const DIVIDER = { x: 416, w: 32 };
const GATE = { y0: 232, y1: 296 };
const PLATE = { x: 372, y: 264 };
const SHELF = { x: 640, y: 142 };

export class ManorScene extends WorldScene {
  private ambient!: Ambient;
  private gate!: Phaser.GameObjects.Image;
  private gateZone!: Phaser.GameObjects.Zone;
  private gateOpen = false;
  private plate!: Phaser.GameObjects.Image;
  private crate!: Phaser.Physics.Arcade.Image;
  private shelf!: Phaser.GameObjects.Image;
  private seal?: Phaser.GameObjects.Image;
  private crateHooked = false;

  constructor() {
    super('manor');
  }

  protected build(): Arrival {
    const save = loadMystery();
    this.gateOpen = false;
    this.crateHooked = false;
    this.physics.world.setBounds(0, 0, SPEC.map.w, SPEC.map.h);
    this.cameras.main.setBackgroundColor('#0e0a12').setBounds(0, -20, SPEC.map.w, SPEC.map.h + 20);
    paintRoom(this, SPEC);
    roomWalls(this, SPEC, (x, y, w, h) => this.solid(x, y, w, h));
    this.divider();

    const lights: LightSpot[] = [];
    const candle = (x: number, y: number) => lights.push({ x, y, size: 150, colour: 0xffb050, flicker: true, always: 0.55 });

    // --- the hall ---
    this.place('portrait-a', 96, 108).setDepth(50);
    this.place('portrait-b', 152, 108).setDepth(50);
    this.place('portrait-c', 336, 108).setDepth(50);
    this.add.image(244, 76, 'seals', 'seal-dark').setScale(0.75).setDepth(50).setAlpha(0.9);
    this.place('candelabra', 64, 150, [16, 8]); candle(64, 104);
    this.place('candelabra', 392, 150, [16, 8]); candle(392, 104);
    this.place('clock', 200, 142, [18, 10]);
    this.place('bookshelf', 288, 142, [30, 10]);
    this.add.image(224, 300, 'rug', 'rug-rose').setDepth(-500).setTint(0x9a7aa8);
    this.place('desk', 120, 300, [92, 22]);
    this.place('candle', 92, 268).setDepth(301); candle(92, 258);
    this.place('candelabra', 64, 372, [16, 8]); candle(64, 326);
    this.place('planter-fern', 392, 380, [22, 8]).setTint(0x9aa8a0);

    // journal pages
    const pageSpots = [{ x: 140, y: 270 }, { x: 330, y: 356 }];
    PAGES.forEach((pg, i) => {
      const img = this.add.image(pageSpots[i].x, pageSpots[i].y, 'journal').setDepth(i === 0 ? 302 : pageSpots[i].y);
      this.tweens.add({ targets: img, y: img.y - 1, yoyo: true, repeat: -1, duration: 900 + i * 200 });
      this.interactables.push({
        id: `page-${i}`, at: { x: pageSpots[i].x, y: pageSpots[i].y + (i === 0 ? 36 : 6) }, who: pg.who, lines: [],
        action: () => {
          const m = loadMystery();
          if (!m.pages.includes(i)) { m.pages.push(i); saveMystery(m); }
          this.say(pg.who, pg.lines);
        },
      });
    });

    // the stone plate, the heavy crate and the gate
    this.plate = this.add.image(PLATE.x, PLATE.y, 'plate', 0).setDepth(-400);
    this.crate = this.physics.add.image(save.seal1 ? PLATE.x : 180, save.seal1 ? PLATE.y + 4 : 264, 'crate', 'crate').setOrigin(0.5, 0.85);
    this.crate.setDrag(900).setMaxVelocity(70).setCollideWorldBounds(true);
    (this.crate.body as Phaser.Physics.Arcade.Body).setSize(22, 12).setOffset(1, 18);
    this.physics.add.collider(this.crate, this.solids);
    this.interactables.push({
      id: 'crate', at: { x: 0, y: 0 }, who: 'Zware kist', lines: ['Een eikenhouten kist vol oude sterrenkaarten. Loodzwaar, maar je kunt hem duwen.'],
    });
    this.gate = this.add.image(DIVIDER.x + 16, GATE.y1, 'iron-gate').setOrigin(0.5, 1).setDepth(GATE.y1);
    this.gateZone = this.solid(DIVIDER.x, GATE.y0, DIVIDER.w, GATE.y1 - GATE.y0);
    this.interactables.push({
      id: 'gate', at: { x: DIVIDER.x - 6, y: GATE.y1 - 20 }, who: 'Ijzeren hek', lines: [],
      action: () => this.say('Ijzeren hek', this.gateOpen
        ? ['Het hek staat open. Erachter zie je een studeerkamer vol boeken.']
        : ['Een zwaar ijzeren hek met het zegel van Hollow. Het zit muurvast.', 'Vlak ervoor ligt een stenen plaat in de vloer, met hetzelfde zegel.']),
    });

    // --- the study ---
    this.place('bookshelf', 496, 142, [30, 10]);
    this.place('bookshelf-b', 528, 142, [30, 10]);
    this.place('bookshelf', 576, 142, [30, 10]);
    this.add.image(SHELF.x, SHELF.y, 'alcove').setOrigin(0.5, 1).setDepth(40);
    if (!save.seal1) {
      this.add.image(SHELF.x, SHELF.y - 4, 'slab').setOrigin(0.5, 1).setScale(0.5).setDepth(45);
      this.seal = this.add.image(SHELF.x, SHELF.y - 14, 'seals', 'seal-gold').setOrigin(0.5, 1).setScale(0.4).setDepth(46);
      this.tweens.add({ targets: this.seal, y: this.seal.y - 2, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
      lights.push({ x: SHELF.x, y: SHELF.y - 30, size: 90, colour: 0xffe27a, always: 0.6 });
    }
    this.shelf = this.place('bookshelf', save.shelfOpen ? SHELF.x + 40 : SHELF.x, SHELF.y);
    const shelfZone = this.solid(SHELF.x - 15, SHELF.y - 10, 30, 10);
    if (save.shelfOpen) { shelfZone.setPosition(SHELF.x + 40, SHELF.y - 5); (shelfZone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject(); }
    const glow = this.add.image(SHELF.x + 4, SHELF.y - 46, 'book-glow').setDepth(SHELF.y + 1).setVisible(!save.shelfOpen);
    this.tweens.add({ targets: glow, alpha: { from: 1, to: 0.55 }, yoyo: true, repeat: -1, duration: 700 });
    this.place('telescope', 700, 200, [20, 8]);
    this.place('desk', 600, 330, [92, 22]);
    this.place('candle', 580, 298).setDepth(331); candle(580, 288);
    this.place('candelabra', 712, 372, [16, 8]); candle(712, 326);
    this.place('portrait-small', 704, 100).setDepth(50);

    this.interactables.push(
      { id: 'telescope', at: { x: 700, y: 212 }, who: 'Telescoop', lines: ['Een koperen telescoop, gericht op het raam. Op een etiketje: "O. H. 1924".', 'Hij wijst precies naar de boekenkast. Of eigenlijk: naar één boek.'] },
      { id: 'portrait', at: { x: 152, y: 156 }, who: 'Portret', lines: ['Een vrouw met een kroontje van sterren en een verrekijker in haar hand.', 'Op het bordje: "Odile Hollow, sterrenkundige". Ze lijkt je aan te kijken.'] },
      {
        id: 'shelf', at: { x: SHELF.x, y: SHELF.y + 18 }, who: 'Boekenkast', lines: [],
        action: () => {
          const m = loadMystery();
          if (m.shelfOpen) { this.say('Boekenkast', ['De kast staat opzij geschoven.']); return; }
          m.shelfOpen = true; saveMystery(m);
          glow.setVisible(false);
          this.say('Boekenkast', ['Eén boek steekt een stukje uit en glanst goud: "Atlas van de Sterren".', 'Je trekt eraan... KLIK. De hele kast schuift knarsend opzij!']);
          this.cameras.main.shake(400, 0.004);
          this.tweens.add({ targets: this.shelf, x: SHELF.x + 40, duration: 1200, ease: 'Sine.easeInOut', onComplete: () => {
            shelfZone.setPosition(SHELF.x + 40, SHELF.y - 5); (shelfZone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
          } });
        },
      },
      {
        id: 'seal', at: { x: SHELF.x, y: SHELF.y + 14 }, who: 'Het eerste zegel', lines: [],
        action: () => {
          const m = loadMystery();
          if (!m.shelfOpen || m.seal1 || !this.seal) return;
          m.seal1 = true; saveMystery(m);
          this.tweens.add({ targets: this.seal, y: this.seal.y - 30, alpha: 0, duration: 900 });
          this.say('Het eerste zegel', SEAL_FOUND);
          this.time.delayedCall(600, () => this.chapterBanner());
        },
      },
    );

    // the seal can only be reached once the shelf has moved
    const sealIt = this.interactables.find((i) => i.id === 'seal')!;
    const shelfIt = this.interactables.find((i) => i.id === 'shelf')!;
    this.events.on('update', () => {
      const m = this.shelfOpenNow();
      sealIt.at.y = m && this.seal ? SHELF.y + 14 : -9999;
      shelfIt.at.y = m ? -9999 : SHELF.y + 18;
      const c = this.interactables.find((i) => i.id === 'crate')!;
      c.at.x = this.crate.x; c.at.y = this.crate.y;
    });

    this.ambient = new Ambient(this, SPEC.map, lights, [], undefined, true, { tint: [150, 140, 190], night: 0.85 });
    return { x: SPEC.door.x, y: 370, facing: 'up' };
  }

  private shelfOpenNow() {
    return this.shelf.x > SHELF.x + 20;
  }

  /** The wall between hall and study, with an opening for the gate. */
  private divider() {
    const g = this.add.graphics().setDepth(5000);
    const R = SPEC.room;
    const band = (y0: number, y1: number) => {
      g.fillStyle(0x1a1018); g.fillRect(DIVIDER.x - 2, y0, DIVIDER.w + 4, y1 - y0);
      g.fillStyle(0x3a3448); g.fillRect(DIVIDER.x, y0, DIVIDER.w, y1 - y0);
      g.fillStyle(0x5a5468); g.fillRect(DIVIDER.x, y0, 2, y1 - y0);
    };
    band(SPEC.wallTop - 16, GATE.y0 - 40);
    band(GATE.y1, R.y + R.h + 16);
    // the wall face above the gate
    g.fillStyle(0x2a2436); g.fillRect(DIVIDER.x, GATE.y0 - 40, DIVIDER.w, 40);
    g.fillStyle(0x1a1018); g.fillRect(DIVIDER.x, GATE.y0 - 4, DIVIDER.w, 4);
    this.solid(DIVIDER.x, 0, DIVIDER.w, GATE.y0);
    this.solid(DIVIDER.x, GATE.y1, DIVIDER.w, SPEC.map.h - GATE.y1);
  }

  private chapterBanner() {
    const cam = this.cameras.main;
    const t = this.add.text(cam.width / 2, 70, 'Hoofdstuk 1 voltooid\nDe Brief', {
      fontFamily: '"Pixelify Sans", "Courier New", monospace', fontSize: '20px', color: '#ffe27a', align: 'center', stroke: '#1a1018', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200000).setResolution(2).setAlpha(0);
    const t2 = this.add.text(cam.width / 2, 118, 'Wordt vervolgd: De Lantaarnkring', {
      fontFamily: '"Pixelify Sans", "Courier New", monospace', fontSize: '12px', color: '#d8d0f0', stroke: '#1a1018', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200000).setResolution(2).setAlpha(0);
    this.tweens.add({ targets: [t, t2], alpha: 1, duration: 800, hold: 4500, yoyo: true, onComplete: () => { t.destroy(); t2.destroy(); } });
  }

  protected tick(time: number) {
    this.ambient.update(time);
    if (!this.player || !this.crate) return;
    if (!this.crateHooked) {
      this.physics.add.collider(this.player, this.crate);
      // an invisible kerb in front of the gate stops the crate (not you) from sliding into it
      const kerb = this.add.zone(DIVIDER.x - 6, (GATE.y0 + GATE.y1) / 2 + 8, 12, GATE.y1 - GATE.y0 + 40);
      this.physics.add.existing(kerb, true);
      this.physics.add.collider(this.crate, kerb);
      this.crateHooked = true;
    }
    // the crate clicks into place on the plate
    if (Math.abs(this.crate.x - PLATE.x) < 12 && Math.abs(this.crate.y - PLATE.y - 4) < 12 && !this.crate.getData('locked')) {
      this.crate.setData('locked', true).setPosition(PLATE.x, PLATE.y + 4).setVelocity(0, 0).setImmovable(true);
      (this.crate.body as Phaser.Physics.Arcade.Body).moves = false;
      this.cameras.main.shake(150, 0.003);
    }
    // the plate is pressed by you or the crate
    const onPlate = (x: number, y: number) => Math.abs(x - PLATE.x) < 15 && Math.abs(y - PLATE.y - 4) < 14;
    const pressed = onPlate(this.player.x, this.player.y) || onPlate(this.crate.x, this.crate.y);
    this.plate.setFrame(pressed ? 1 : 0);
    // never close the gate on someone standing in it
    const inGate = this.player.x > DIVIDER.x - 10 && this.player.x < DIVIDER.x + DIVIDER.w + 10 && this.player.y > GATE.y0 && this.player.y < GATE.y1 + 8;
    const shouldOpen = pressed || (this.gateOpen && inGate);
    if (shouldOpen !== this.gateOpen) {
      this.gateOpen = shouldOpen;
      (this.gateZone.body as Phaser.Physics.Arcade.StaticBody).enable = !shouldOpen;
      this.tweens.killTweensOf(this.gate);
      this.tweens.add({ targets: this.gate, y: shouldOpen ? GATE.y0 + 6 : GATE.y1, alpha: shouldOpen ? 0.35 : 1, duration: 450, ease: 'Sine.easeInOut' });
      if (shouldOpen && onPlate(this.player.x, this.player.y) && !onPlate(this.crate.x, this.crate.y)) {
        const m = loadMystery();
        if (!m.plateHint) {
          m.plateHint = true; saveMystery(m);
          this.say('Stenen plaat', ['KLIK! Het hek schuift omhoog...', '...maar zodra je eraf stapt, zakt het weer dicht. Iets zwaars zou helpen. Of iemand die het voor je openhoudt.']);
        }
      }
    }
    this.crate.setDepth(this.crate.y);
    if (this.registry.get('started') && this.player.y > SPEC.room.y + SPEC.room.h + 8) this.travel('manor-grounds', { x: 272, y: 252, facing: 'down' });
  }

}
