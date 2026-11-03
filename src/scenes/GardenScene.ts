import Phaser from 'phaser';
import { TILE } from '../config';
import { sprites } from '../assets';
import * as G from '../content/villaGarden';
import { paintGround } from '../world/ground';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, type LightSpot } from '../world/ambient';
import { GILLY_LOOK, gillyRamble } from '../content/gilly';
import { YARA_LOOK, BEN_LOOK, yaraTalk, benTalk } from '../content/family';
import { addCritter, GOAT, CHICKEN } from '../world/critters';
import type { Look } from '../characters/look';

const T = TILE;

/** The villa garden: the first playable area. */
export class GardenScene extends WorldScene {
  private ambient!: Ambient;

  constructor() {
    super('garden');
  }

  protected build(): Arrival {
    const worldW = G.MAP_W * T, worldH = G.MAP_H * T;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH).setBackgroundColor('#2d4a2b');

    paintGround(this, 'garden-ground', { w: G.MAP_W, h: G.MAP_H, dirt: G.dirt, pond: G.pond, soil: G.soil, seed: 21 });
    this.add.image(0, 0, 'garden-ground').setOrigin(0).setDepth(-1000);

    this.buildPond();
    this.buildHouse();
    this.buildFences();
    this.buildNature();
    this.buildProps();
    this.buildBorders();
    this.buildAmbient();

    this.interactables = G.interactables.map((it) => ({ ...it }));
    const door = this.interactables.find((i) => i.id === 'door');
    if (door) { door.lines = []; door.action = () => this.enterHouse(); }
    const pond = this.interactables.find((i) => i.id === 'pond');
    if (pond) { pond.lines = []; pond.who = 'Vissen'; pond.action = () => this.startFishing(); }
    this.addKroki();
    this.addGoats();
    this.addVisitor('Gilly', GILLY_LOOK, [{ x: 300, y: 380 }, { x: 330, y: 560 }, { x: 140, y: 360 }, { x: 420, y: 500 }], gillyRamble);
    this.addVisitor('Yara', YARA_LOOK, [{ x: 640, y: 300 }, { x: 700, y: 410 }, { x: 760, y: 330 }, { x: 600, y: 420 }], yaraTalk, 26);
    this.addVisitor('Ben', BEN_LOOK, [{ x: 300, y: 250 }, { x: 250, y: 290 }, { x: 360, y: 280 }], benTalk, 22);
    return { x: G.spawn.x, y: G.spawn.y };
  }

  /** Kroki on his perch: hops and blinks, and does a happy little flight when you visit. */
  private addKroki() {
    const perch = G.handmade.find((h) => h.key === 'perch')!;
    const home = { x: perch.x * T - 9, y: perch.y * T - 50 };
    const kroki = this.add.sprite(home.x, home.y, 'kroki').setOrigin(0.5, 1).setDepth(perch.y * T + 1).play('kroki-idle');
    const it = this.interactables.find((i) => i.id === 'kroki');
    if (!it) return;
    it.lines = [];
    it.action = () => {
      if (kroki.getData('flying')) return;
      kroki.setData('flying', true).play('kroki-flap').setDepth(100000);
      this.tweens.chain({
        targets: kroki,
        tweens: [
          { x: home.x - 30, y: home.y - 34, duration: 380, ease: 'Sine.easeOut', onStart: () => kroki.setFlipX(true) },
          { x: home.x + 34, y: home.y - 46, duration: 520, ease: 'Sine.easeInOut', onStart: () => kroki.setFlipX(false) },
          { x: home.x, y: home.y, duration: 420, ease: 'Sine.easeIn', onStart: () => kroki.setFlipX(true) },
        ],
        onComplete: () => { kroki.setFlipX(false).setDepth(perch.y * T + 1).play('kroki-idle').setData('flying', false); },
      });
      this.say('Kroki', [
        'Kroki fladdert een vrolijk rondje en landt weer op zijn stokje.',
        'Hij kijkt je met zijn kopje scheef aan. Dit is zijn plekje, en hier is hij thuis.',
      ]);
    };
  }

  /** Three goats in their meadow and a few chickens around the vegetable patch. */
  private addGoats() {
    const g = G.goatPen;
    const area = { x0: (g.x + 1) * T + 16, x1: (g.x + g.w - 1) * T - 16, y0: (g.y + 1) * T + 24, y1: (g.y + g.h - 1) * T + 4 };
    const goats: Array<[string, string]> = [['Sneeuwvlokje', 'white'], ['Karamel', 'brown'], ['Drop', 'black']];
    for (const [name, coat] of goats) {
      const goat = addCritter(this, GOAT, `goat-${coat}`, area, 26);
      this.follow(goat, {
        id: `goat-${name}`, who: name, lines: [],
        action: () => this.say(name, [Phaser.Math.RND.pick(['Mèèèèh!', 'Mèh. (Ze kauwt rustig verder op wat hooi.)', 'Mèèh? (Ze kijkt hoopvol naar je zakken. Heb je iets lekkers?)', 'MÈÈÈH! (Ze springt op van enthousiasme.)']), `${name} lijkt het hier prima naar haar zin te hebben.`]),
      });
    }
    const coop = { x0: 3 * T, x1: 12 * T, y0: 18.6 * T, y1: 23.4 * T };
    const chickens = ['Tokkie', 'Kakel', 'Pip', 'Henny'];
    for (const name of chickens) {
      const c = addCritter(this, CHICKEN, 'chicken-walk', coop, 34);
      this.follow(c, { id: `chicken-${name}`, who: name, lines: [], action: () => this.say(name, [Phaser.Math.RND.pick(['Tok tok tok!', 'Tok? (Ze pikt naar je schoenveter.)', 'Kakelkakel! (Ze rent weg en komt meteen weer terug.)'])]) });
    }
  }

  /** Keeps an interactable on top of a moving sprite. */
  private follow(sprite: Phaser.GameObjects.Sprite, it: { id: string; who: string; lines: string[]; action: () => void }) {
    const entry = { ...it, at: { x: sprite.x, y: sprite.y } };
    this.interactables.push(entry);
    this.events.on('update', () => { entry.at.x = sprite.x; entry.at.y = sprite.y - 4; });
  }

  /** A family member visiting: wanders between a few spots and stops to talk when you press E. */
  private addVisitor(name: string, look: Look, spots: Array<{ x: number; y: number }>, talk: () => string[], pace = 16) {
    const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
    const it = { id: name, at: { x: -999, y: -999 }, who: name, lines: [] as string[], action: () => {} };
    this.interactables.push(it);
    install(look).then((key) => {
      if (!this.sys.isActive()) return;
      const npc = this.add.sprite(spots[0].x, spots[0].y, `${key}-idle`, 6).setOrigin(0.5, 61 / 64).play(`${key}-idle-down`);
      this.add.image(0, 0, 'shadow').setOrigin(0.5, 0.6).setName(`${name}-shadow`);
      const shadow = this.children.getByName(`${name}-shadow`) as Phaser.GameObjects.Image;
      let talking = false;
      const dirTo = (dx: number, dy: number) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down');
      const walk = () => {
        if (talking || !this.sys.isActive()) return;
        const to = Phaser.Math.RND.pick(spots);
        const dx = to.x - npc.x, dy = to.y - npc.y;
        npc.play(`${key}-walk-${dirTo(dx, dy)}`);
        this.tweens.add({
          targets: npc, x: to.x, y: to.y, duration: Math.max(200, Math.hypot(dx, dy) * pace),
          onComplete: () => { npc.play(`${key}-idle-down`); this.time.delayedCall(Phaser.Math.Between(2500, 7000), walk); },
        });
      };
      it.action = () => {
        talking = true;
        this.tweens.killTweensOf(npc);
        npc.play(`${key}-idle-${dirTo(this.player.x - npc.x, this.player.y - npc.y)}`);
        this.say(name, talk());
        this.time.delayedCall(6000, () => { talking = false; walk(); });
      };
      this.time.delayedCall(Phaser.Math.Between(1000, 3000), walk);
      this.events.on('update', () => {
        npc.setDepth(npc.y);
        shadow.setPosition(Math.round(npc.x), Math.round(npc.y)).setDepth(npc.y - 1);
        it.at.x = npc.x; it.at.y = npc.y - 6;
      });
    });
  }

  private enterHouse() {
    this.travel('house', { x: 256, y: 372, facing: 'up' });
  }

  protected tick(time: number) {
    this.ambient.update(time);
    // Walking up the stairs into the doorway also goes inside.
    const p = this.player;
    if (p && this.registry.get('started') && Math.abs(p.x - G.doorway.x) < 24 && p.y < G.doorway.y && p.facing === 'up') this.enterHouse();
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

  private buildAmbient() {
    const lights: LightSpot[] = [];
    for (const p of G.props) {
      if (p.key === 'lamp') lights.push({ x: p.x * T, y: p.y * T - 68, size: 170 });
      if (p.anim === 'fire') lights.push({ x: p.x * T, y: p.y * T - 12, size: 200, flicker: true, colour: 0xff9a40, always: 0.12 });
    }
    const { x, y } = G.house;
    lights.push({ x: x + 128, y: y + 143, size: 90 }, { x: x + 192, y: y + 112, size: 90 }, { x: x + 80, y: y + 150, size: 70 });
    const flowers = G.flowers.filter(([k]) => k.startsWith('flowers')).map(([, fx, fy]) => ({ x: fx * T, y: fy * T }));
    const p = G.pond;
    this.ambient = new Ambient(this, { w: G.MAP_W * T, h: G.MAP_H * T }, lights, flowers,
      { x: (p.x + 0.8) * T, y: (p.y + 0.9) * T, w: (p.w - 1.6) * T, h: (p.h - 1.8) * T });
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
}
