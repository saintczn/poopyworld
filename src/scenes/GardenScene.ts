import Phaser from 'phaser';
import { TILE } from '../config';
import { sprites } from '../assets';
import * as G from '../content/villaGarden';
import { paintGround } from '../world/ground';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, isWinter, type LightSpot } from '../world/ambient';
import { Atmosphere } from '../world/atmosphere';
import { decorateGarden } from '../world/festive';
import { snowfall } from './SnowScene';
import { GILLY_LOOK, gillyRamble } from '../content/gilly';
import { YARA_LOOK, BEN_LOOK, yaraTalk, benTalk, molTalk, simbaTalk } from '../content/family';
import { addCritter, GOAT, CHICKEN } from '../world/critters';
import { loadMystery, saveMystery, LETTER, LETTER2, LETTER4 } from '../content/mystery';
import { starName } from './StarChamberScene';
import { askText } from '../ui/memories';

const T = TILE;

/** The villa garden: the first playable area. */
export class GardenScene extends WorldScene {
  private ambient!: Ambient;

  constructor() {
    super('garden');
  }

  private atmo!: Atmosphere;

  protected build(): Arrival {
    this.atmo = new Atmosphere(this);
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
    const gate = this.interactables.find((i) => i.id === 'gate');
    if (gate) { gate.who = 'Naar Heartwood'; gate.lines = []; gate.action = () => this.travel('village', { x: 22 * T, y: 3.4 * T, facing: 'down' }); }
    this.addPetTurtle();
    if (loadMystery().finale) {
      // Odile's telescope: look at your star
      this.place('telescope', G.house.x + 300, G.house.y + 262, [16, 8]);
      this.interactables.push({ id: 'star', at: { x: G.house.x + 300, y: G.house.y + 276 }, who: 'Telescoop', lines: [], action: () => this.lookAtStar() });
    }
    decorateGarden(this, { x: G.house.x, y: G.house.y, w: 320 }, { x: G.house.x + 80, y: G.house.y + 300 });
    const pond = this.interactables.find((i) => i.id === 'pond');
    if (pond) { pond.lines = []; pond.who = 'Vissen'; pond.action = () => this.startFishing(); }
    const mailbox = this.interactables.find((i) => i.id === 'mailbox');
    if (mailbox) {
      const normal = mailbox.lines;
      mailbox.lines = [];
      mailbox.action = () => {
        const m = loadMystery();
        if (!m.letter) { m.letter = true; saveMystery(m); this.say('Brievenbus', LETTER); }
        else if (m.seal1 && !m.letter2) { m.letter2 = true; saveMystery(m); this.say('Brievenbus', LETTER2); }
        else if (m.seal3 && !m.letter4) { m.letter4 = true; saveMystery(m); this.say('Brievenbus', LETTER4); }
        else if (m.finale) this.say('Brievenbus', ['Een laatste kaartje, met een sterretje erop getekend: "Dank jullie wel. Kijk omhoog. — O."']);
        else if (m.letter4) this.say('Brievenbus', ['De laatste brief van O. H. heb je al. Het begin is de oude put achter het landhuis.']);
        else if (m.seal2) this.say('Brievenbus', ['Leeg. Ergens in de verte slaat een klok. "Zoek de klok die nooit stilstaat..."']);
        else this.say('Brievenbus', m.letter2 ? ['De tweede brief van O. H. heb je al gelezen. Het luik zit onder het blauwe kleed in de studeerkamer.'] : ['De brief van O. H. heb je al gelezen.', 'Het pad naar de heuvel begint aan het eind van de onderste straat in Heartwood.', ...normal.slice(0, 0)]);
      };
    }
    this.addKroki();
    this.addGoats();
    this.addVisitor('Gilly', GILLY_LOOK, [{ x: 300, y: 380 }, { x: 330, y: 560 }, { x: 140, y: 360 }, { x: 420, y: 500 }], gillyRamble);
    this.addVisitor('Yara', YARA_LOOK, [{ x: 640, y: 300 }, { x: 700, y: 410 }, { x: 760, y: 330 }, { x: 600, y: 420 }], yaraTalk, 26);
    this.addVisitor('Buurman Mol', { sprite: 'mole', feet: 46 / 48 }, [{ x: 400, y: 252 }, { x: 560, y: 262 }, { x: 740, y: 252 }, { x: 800, y: 196 }, { x: 470, y: 300 }], molTalk, 30);
    this.addVisitor('Simba', { sprite: 'cat', feet: 30 / 32 }, [{ x: 620, y: 470 }, { x: 520, y: 380 }, { x: 700, y: 560 }, { x: 860, y: 420 }, { x: 460, y: 520 }], simbaTalk, 20);
    if (isWinter()) this.winter();
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


  private enterHouse() {
    this.travel('house', { x: 256, y: 372, facing: 'up' });
  }

  /** A little turtle that lives by the pond. You can give it a name. */
  private addPetTurtle() {
    const KEY = 'poopyworld.pet.v1';
    const load = (): { name?: string; pets?: number } => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } };
    const save = (v: { name?: string; pets?: number }) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* fine */ } };
    if (!this.anims.exists('turtle-crawl')) this.anims.create({ key: 'turtle-crawl', frames: this.anims.generateFrameNumbers('bali-turtle', { start: 0, end: 1 }), frameRate: 2, repeat: -1 });
    const t = this.add.sprite(10.5 * T, 14 * T, 'bali-turtle', 0).setScale(0.7).play('turtle-crawl');
    const go = () => {
      if (!t.active) return;
      const tx = Phaser.Math.FloatBetween(9.4, 12.6) * T, ty = Phaser.Math.FloatBetween(12.6, 17.4) * T;
      t.setRotation(Phaser.Math.Angle.Between(t.x, t.y, tx, ty) + Math.PI / 2).play('turtle-crawl');
      this.tweens.add({
        targets: t, x: tx, y: ty, duration: 4000 + Phaser.Math.Distance.Between(t.x, t.y, tx, ty) * 70, ease: 'Sine.easeInOut',
        onUpdate: () => { t.setDepth(t.y); entry.at.x = t.x; entry.at.y = t.y + 10; },
        onComplete: () => { t.stop(); this.time.delayedCall(Phaser.Math.Between(2000, 6000), go); },
      });
    };
    const entry = {
      id: 'pet-turtle', at: { x: t.x, y: t.y + 10 }, who: load().name ?? 'Schildpadje', lines: [] as string[],
      action: () => {
        const pet = load();
        if (!pet.name) {
          this.say('Schildpadje', ['Een klein schildpadje! Het woont bij de vijver en eet het liefst blaadjes sla.', 'Het heeft nog geen naam. Wil jij er een bedenken?'], () => {
            this.player.halt();
            askText({ title: 'Hoe heet het schildpadje?', text: 'Kies een naam. Het schildpadje luistert er vanaf nu naar (een beetje).', placeholder: 'Bijvoorbeeld: Turbo', ok: 'Dat is de naam!', max: 20 }, (name) => {
              if (!name) return;
              save({ ...load(), name });
              entry.who = name;
              this.say(name, [`Welkom in de familie, ${name}!`, `${name} knippert heel langzaam. Dat betekent ja.`]);
            });
          });
          return;
        }
        pet.pets = (pet.pets ?? 0) + 1; save(pet);
        const n = pet.name;
        const lines = [
          [`${n} knabbelt aan een blaadje sla.`, 'Heel. Erg. Langzaam.'],
          [`Je aait ${n} over het schild.`, `${n} steekt het koppie iets verder uit. Dat vindt hij fijn.`],
          [`${n} probeert een race te houden met een kip.`, 'De kip weet nog van niks.'],
          [`${n} kijkt naar de vijver en denkt na over het leven.`],
          [`${n} heeft van Kroki gehoord dat er op Bali zeeschildpadden wonen.`, 'Familie, zegt hij.'],
        ];
        this.say(n, [...lines[pet.pets % lines.length], `(${n} is al ${pet.pets} keer geaaid)`]);
      },
    };
    this.interactables.push(entry);
    go();
  }

  /** December to February: snow on the garden. */
  private winter() {
    this.add.rectangle(0, 0, G.MAP_W * T, G.MAP_H * T, 0xf4f8ff, 0.62).setOrigin(0).setDepth(-900);
    for (const [x, y] of [[620, 600], [860, 520], [300, 640], [980, 300], [180, 300]]) this.add.image(x, y, 'snow-pile').setOrigin(0.5, 0.8).setDepth(y);
    snowfall(this, 60);
  }

  /** Looking through Odile's telescope at the star named after you. */
  private lookAtStar() {
    this.player.halt();
    this.registry.set('started', false);
    const cam = this.cameras.main;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const g = this.add.graphics();
    g.fillStyle(0x060818); g.fillRect(0, 0, 640, 360);
    for (let i = 0; i < 220; i++) { g.fillStyle(0xffffff, 0.2 + (i % 7) * 0.1); g.fillRect((i * 97) % 640, (i * 61) % 360, i % 13 === 0 ? 2 : 1, i % 13 === 0 ? 2 : 1); }
    g.lineStyle(60, 0x000000); g.strokeCircle(320, 180, 200);
    parts.push(g);
    const glow = this.add.image(320, 160, 'glow').setScale(0.7).setTint(0xfff4c0).setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.image(320, 160, 'dot').setScale(3);
    const name = this.add.text(320, 222, `De Ster van ${starName((this.registry.get('playerName') as string) || 'jullie')}`, { fontFamily: '"Pixelify Sans", monospace', fontSize: '16px', color: '#fff4c0' }).setOrigin(0.5).setResolution(2);
    const hint = this.add.text(320, 330, 'E: terug', { fontFamily: '"Pixelify Sans", monospace', fontSize: '10px', color: '#8a90b0' }).setOrigin(0.5).setResolution(2);
    parts.push(glow, core, name, hint);
    this.tweens.add({ targets: glow, scale: 0.85, alpha: 0.7, duration: 1400, yoyo: true, repeat: -1 });
    const box = this.add.container(0, 0, parts).setScrollFactor(0).setDepth(300000).setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 600 });
    this.time.delayedCall(500, () => this.input.keyboard!.once('keydown-E', () => {
      this.tweens.add({ targets: box, alpha: 0, duration: 400, onComplete: () => { box.destroy(); this.registry.set('started', true); } });
    }));
    void cam;
  }

  protected tick(time: number) {
    this.ambient.update(time);
    // Walking up the stairs into the doorway also goes inside.
    const p = this.player;
    if (p && this.registry.get('started') && Math.abs(p.x - G.doorway.x) < 24 && p.y < G.doorway.y && p.facing === 'up') this.enterHouse();
    if (p && this.registry.get('started') && p.y > G.MAP_H * T - 14) this.travel('village', { x: 22 * T, y: 3.4 * T, facing: 'down' });
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
    // The villa: the brick house made 64 px wider (see tools/build_assets.py).
    this.add.image(x, y, 'villa').setOrigin(0).setDepth(y + 192);
    // Walls (the stairs at the front door stay walkable).
    this.solid(x + 32, y + 100, 192, 76);
    this.solid(x + 32, y + 176, 32, 16);
    this.solid(x + 96, y + 176, 128, 16);
    this.solid(x + 224, y + 70, 64, 90);
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
      const tree = this.place(key, px, py, [22, 10]);
      const tint = this.atmo.treeTint();
      if (tint && !pine) tree.setTint(tint);
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
    lights.push({ x: x + 140, y: y + 143, size: 90 }, { x: x + 192, y: y + 143, size: 90 }, { x: x + 256, y: y + 112, size: 90 }, { x: x + 80, y: y + 150, size: 70 });
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
    // The road to Heartwood is open: walking out of the gate goes to the village (see tick).
  }
}
