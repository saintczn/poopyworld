import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { paintRoom, roomWalls, type RoomSpec } from '../world/room';
import { Darkness } from '../world/darkness';
import { loadMystery, saveMystery, TOWER, SEAL3_FOUND } from '../content/mystery';

/**
 * Inside the clock tower: giant gears and the back of the clock face.
 * Set the hands with the two levers and pull the bell rope. The right time (from Odile's records) opens a hatch.
 */
const SPEC: RoomSpec = {
  key: 'tower-room', map: { w: 640, h: 448 }, room: { x: 32, y: 160, w: 576, h: 224 }, wallTop: 32,
  door: { x: 560, w: 64 }, floorCol: 0, floorRow: 3, wallBlock: 384, band: [0x3a3030, 0x4a4040, 0x1a1414],
};
const FACE = { x: 320, y: 108 };
const ANSWER = { h: 11, m: 20 };

export class ClockTowerScene extends WorldScene {
  private hour = 3;
  private minute = 45;
  private hands!: Phaser.GameObjects.Graphics;
  private gears: Phaser.GameObjects.Image[] = [];
  private solved = false;
  private dark!: Darkness;

  constructor() {
    super('clocktower');
  }

  protected build(): Arrival {
    const save = loadMystery();
    this.solved = !!save.seal3;
    this.hour = this.solved ? ANSWER.h : 3; this.minute = this.solved ? ANSWER.m : 45;
    this.gears = [];
    this.physics.world.setBounds(0, 0, SPEC.map.w, SPEC.map.h);
    this.cameras.main.setBackgroundColor('#0a0608').setBounds(0, -20, SPEC.map.w, SPEC.map.h + 20);
    paintRoom(this, SPEC);
    roomWalls(this, SPEC, (x, y, w, h) => this.solid(x, y, w, h));

    // gears turning in the walls
    for (const [key, x, y, speed] of [['hm-gear-big', 90, 90, 1], ['hm-gear-small', 150, 46, -1.8], ['hm-gear-big', 550, 96, -1], ['hm-gear-small', 490, 50, 1.8], ['hm-gear-small', 100, 160, -1.6], ['hm-gear-big', 560, 190, 0.8]] as const) {
      const g = this.add.image(x, y, key).setDepth(50).setData('speed', speed);
      this.gears.push(g);
    }
    // the clock face from behind, with moonlight shining through
    this.add.image(FACE.x, FACE.y, 'hm-clockface').setDepth(55);
    this.add.image(FACE.x, FACE.y, 'glow').setScale(1.4).setTint(0xc8d8ff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25).setDepth(95004);
    this.hands = this.add.graphics().setDepth(56);
    this.drawHands();

    // two levers and the bell rope
    const lever = (x: number, label: string) => {
      const g = this.add.graphics().setDepth(260);
      g.fillStyle(0x4a3a2a); g.fillRect(x - 14, 250, 28, 14);
      g.fillStyle(0x8a8a90); g.fillRect(x - 2, 216, 4, 36);
      g.fillStyle(0xc0392b); g.fillCircle(x, 214, 6);
      this.add.text(x, 272, label, { fontFamily: '"Pixelify Sans", monospace', fontSize: '9px', color: '#d8c8a8' }).setOrigin(0.5).setResolution(2).setDepth(261);
      this.solid(x - 12, 248, 24, 14);
      return g;
    };
    const hl = lever(200, 'UREN'), ml = lever(440, 'MINUTEN');
    this.interactables.push(
      { id: 'hours', at: { x: 200, y: 280 }, who: 'Urenhendel', lines: [], action: () => this.turn(hl, () => { this.hour = this.hour % 12 + 1; }) },
      { id: 'minutes', at: { x: 440, y: 280 }, who: 'Minutenhendel', lines: [], action: () => this.turn(ml, () => { this.minute = (this.minute + 5) % 60; }) },
    );
    const rope = this.add.graphics().setDepth(300);
    rope.lineStyle(3, 0xc8b890); rope.lineBetween(320, 0, 320, 300);
    rope.fillStyle(0xc0392b); rope.fillCircle(320, 302, 5);
    this.interactables.push({ id: 'rope', at: { x: 320, y: 318 }, who: 'Klokkentouw', lines: [], action: () => this.ring() });

    // the hatch with the third seal
    if (!this.solved || !save.seal3) {
      const seal = this.add.image(FACE.x, 196, 'hm-seal-cat').setDepth(200).setScale(0.8).setVisible(false).setName('seal3');
      this.interactables.push({ id: 'seal3', at: { x: FACE.x, y: -9999 }, who: 'Het derde zegel', lines: [], action: () => this.takeSeal(seal) });
    }

    this.dark = new Darkness(this, 0.6);
    if (!save.seal3) this.time.delayedCall(400, () => this.say('Klokkentoren', TOWER.enter));
    return { x: SPEC.door.x, y: SPEC.room.y + SPEC.room.h - 16, facing: 'up' };
  }

  private turn(g: Phaser.GameObjects.Graphics, change: () => void) {
    if (this.solved) { this.say('Hendel', ['De klok staat goed. Hij tikt rustig door.']); return; }
    change();
    this.tweens.add({ targets: g, angle: { from: -8, to: 0 }, duration: 200 });
    this.drawHands();
  }

  private drawHands() {
    const g = this.hands; g.clear();
    const ha = ((this.hour % 12) + this.minute / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const ma = this.minute / 60 * Math.PI * 2 - Math.PI / 2;
    g.lineStyle(6, 0x2a1a10); g.lineBetween(FACE.x, FACE.y, FACE.x + Math.cos(ha) * 42, FACE.y + Math.sin(ha) * 42);
    g.lineStyle(4, 0x2a1a10); g.lineBetween(FACE.x, FACE.y, FACE.x + Math.cos(ma) * 64, FACE.y + Math.sin(ma) * 64);
    g.fillStyle(0xc9a040); g.fillCircle(FACE.x, FACE.y, 6);
  }

  private ring() {
    if (this.solved) { this.say('Klokkentouw', ['DONG. Een diepe, mooie klank. De hele toren trilt mee.']); return; }
    this.cameras.main.shake(400, 0.008);
    if (this.hour === ANSWER.h && this.minute === ANSWER.m) {
      this.solved = true;
      this.say('Klokkentoren', TOWER.right, () => {
        const seal = this.children.getByName('seal3') as Phaser.GameObjects.Image | null;
        if (!seal) return;
        seal.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: seal, alpha: 1, y: 206, duration: 900 });
        this.tweens.add({ targets: seal, y: 202, duration: 1000, yoyo: true, repeat: -1, delay: 900 });
        this.interactables.find((i) => i.id === 'seal3')!.at.y = 230;
      });
    } else {
      this.say('Klokkentoren', TOWER.wrong(this.hour, this.minute));
    }
  }

  private takeSeal(seal: Phaser.GameObjects.Image) {
    const m = loadMystery();
    if (m.seal3) return;
    m.seal3 = true; saveMystery(m);
    this.tweens.add({ targets: seal, y: seal.y - 30, alpha: 0, duration: 900 });
    this.interactables.find((i) => i.id === 'seal3')!.at.y = -9999;
    this.say('Het derde zegel', SEAL3_FOUND, () => this.banner('Hoofdstuk 3 voltooid\nDe Klokkentoren', 'Drie van de vier zegels.\nKijk in de brievenbus...', '#ffe2b0'));
  }

  protected tick(time: number) {
    const sp = this.solved ? 3 : 1;
    for (const g of this.gears) g.rotation += (g.getData('speed') as number) * 0.004 * sp * (this.game.loop.delta / 16);
    const p = this.player;
    this.dark.update([...(p ? [{ x: p.x, y: p.y - 20, size: 1.1 }] : []), { x: FACE.x, y: FACE.y, size: 1.5 }]);
    void time;
    if (this.registry.get('started') && p && p.y > SPEC.room.y + SPEC.room.h + 8) this.travel('attic', { x: 560, y: 190, facing: 'down' });
  }
}
