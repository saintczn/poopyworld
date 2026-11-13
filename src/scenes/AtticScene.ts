import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { paintRoom, roomWalls, type RoomSpec } from '../world/room';
import { Darkness } from '../world/darkness';
import { loadMystery, saveMystery, ATTIC, RECORDS } from '../content/mystery';

/**
 * The attic above Hollowmere: moonlight through a round window, dust sheets, old trunks,
 * a gramophone and three of Odile's records hidden around. A ladder leads up to the clock tower.
 */
const SPEC: RoomSpec = {
  key: 'attic-room', map: { w: 640, h: 448 }, room: { x: 32, y: 128, w: 576, h: 256 }, wallTop: 32,
  door: { x: 120, w: 64 }, floorCol: 0, floorRow: 0, wallBlock: 384, band: [0x3a3030, 0x4a4040, 0x1a1414],
};

export class AtticScene extends WorldScene {
  private dark!: Darkness;

  constructor() {
    super('attic');
  }

  protected build(): Arrival {
    const save = loadMystery();
    this.physics.world.setBounds(0, 0, SPEC.map.w, SPEC.map.h);
    this.cameras.main.setBackgroundColor('#0a0608').setBounds(0, -20, SPEC.map.w, SPEC.map.h + 20);
    paintRoom(this, SPEC);
    roomWalls(this, SPEC, (x, y, w, h) => this.solid(x, y, w, h));

    // slanted roof beams
    const g = this.add.graphics().setDepth(60);
    g.fillStyle(0x2a1a10);
    for (const x of [100, 260, 420, 560]) { g.fillRect(x, 30, 10, 98); g.fillTriangle(x, 30, x + 10, 30, x + 40, 0); }
    g.fillRect(32, 30, 576, 8);

    // the round window and its moonlight
    this.add.image(320, 74, 'hm-roundwindow').setDepth(61);
    const beam = this.add.image(320, 250, 'glow').setScale(1.6, 0.9).setTint(0xa8c0ff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setDepth(95004);
    this.tweens.add({ targets: beam, alpha: 0.25, duration: 3000, yoyo: true, repeat: -1 });
    this.interactables.push({ id: 'window', at: { x: 320, y: 140 }, who: 'Rond raam', lines: ATTIC.window });

    // furniture under dust sheets, trunks, cobwebs
    this.place('hm-dustsheet', 120, 220, [48, 14]);
    this.place('hm-dustsheet', 480, 230, [48, 14]);
    this.place('hm-dustsheet', 230, 352, [48, 14]);
    this.place('crates', 560, 340, [30, 12]);
    this.place('barrels', 70, 360, [40, 14]);
    this.add.image(32, 128, 'hm-cobweb').setOrigin(0).setDepth(70);
    this.add.image(576, 128, 'hm-cobweb').setOrigin(0).setFlipX(true).setDepth(70);

    // the records: one under a dust sheet, one by the crates, one on the window sill
    const found = save.records ?? [];
    const spots: Record<string, { x: number; y: number; hidden?: string }> = {
      red: { x: 480, y: 238, hidden: 'sheet-480' }, blue: { x: 530, y: 356 }, yellow: { x: 88, y: 300 },
    };
    for (const r of RECORDS) {
      if (found.includes(r.id)) continue;
      const sp = spots[r.id];
      const img = this.add.image(sp.x, sp.y, r.tex).setDepth(sp.y + 2).setVisible(!sp.hidden);
      const glow = this.add.image(sp.x, sp.y, 'glow').setScale(0.25).setTint(0xffe27a).setBlendMode(Phaser.BlendModes.ADD).setDepth(95004).setVisible(!sp.hidden);
      this.tweens.add({ targets: glow, alpha: { from: 0.3, to: 0.9 }, duration: 800, yoyo: true, repeat: -1 });
      const pick = {
        id: `record-${r.id}`, at: { x: sp.x, y: sp.hidden ? -9999 : sp.y + 8 }, who: r.name, lines: [] as string[],
        action: () => {
          const m = loadMystery(); m.records = [...new Set([...(m.records ?? []), r.id])]; saveMystery(m);
          img.destroy(); glow.destroy(); pick.at.y = -9999;
          this.say(r.name, [`Een oude grammofoonplaat met een ${r.name.split(' ')[0].toLowerCase()} etiket. Op het label: "O. H."`, 'Leg hem op de grammofoon om hem af te spelen.']);
        },
      };
      this.interactables.push(pick);
      if (sp.hidden) {
        this.interactables.push({
          id: sp.hidden, at: { x: 480, y: 248 }, who: 'Stoffig laken', lines: [], action: () => {
            if (img.visible) { this.say('Stoffig laken', ATTIC.sheetEmpty); return; }
            img.setVisible(true); glow.setVisible(true); pick.at.y = sp.y + 8;
            this.cameras.main.shake(120, 0.002);
            this.say('Stoffig laken', ATTIC.sheet);
          },
        });
      }
    }
    if (found.includes('red')) this.interactables.push({ id: 'sheet-480', at: { x: 480, y: 248 }, who: 'Stoffig laken', lines: ATTIC.sheetEmpty });
    for (const x of [120, 230]) this.interactables.push({ id: `sheet-${x}`, at: { x, y: x === 230 ? 368 : 238 }, who: 'Stoffig laken', lines: ATTIC.sheetEmpty });

    // the gramophone plays whatever records you have, in order
    this.place('hm-gramophone', 200, 168, [26, 10]);
    this.interactables.push({
      id: 'gramophone', at: { x: 200, y: 184 }, who: 'Grammofoon', lines: [], action: () => {
        const have = RECORDS.filter((r) => (loadMystery().records ?? []).includes(r.id));
        if (!have.length) { this.say('Grammofoon', ATTIC.gramophoneEmpty); return; }
        const lines = have.flatMap((r) => [`[${r.name}]`, ...r.lines]);
        if (have.length < RECORDS.length) lines.push(`Je hebt ${have.length} van de ${RECORDS.length} platen. Er moeten er nog meer zijn.`);
        this.say('Grammofoon', lines);
      },
    });

    // the ladder up to the clock tower
    this.place('hm-ladder', 560, 142, [24, 8]);
    this.interactables.push({ id: 'ladder', at: { x: 560, y: 156 }, who: 'Ladder', lines: [], action: () => this.say('Ladder', ATTIC.ladder, () => this.travel('clocktower', { x: 320, y: 360, facing: 'up' })) });

    this.dark = new Darkness(this, 0.82);
    if (!found.length) this.time.delayedCall(500, () => this.say('Zolder', ATTIC.enter));
    return { x: SPEC.door.x, y: SPEC.room.y + SPEC.room.h - 16, facing: 'up' };
  }

  protected tick() {
    const p = this.player;
    this.dark.update([
      ...(p ? [{ x: p.x, y: p.y - 20 }] : []),
      { x: 320, y: 230, size: 1.2 }, { x: 320, y: 90, size: 0.6 },
    ]);
    if (this.registry.get('started') && p && p.y > SPEC.room.y + SPEC.room.h + 8) this.travel('manor', { x: 200, y: 190, facing: 'down' });
  }
}
