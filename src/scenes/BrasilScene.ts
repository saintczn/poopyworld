import Phaser from 'phaser';
import { TILE } from '../config';
import * as R from '../content/brasil';
import { GILLY_LOOK } from '../content/gilly';
import { YARA_LOOK, BEN_LOOK } from '../content/family';
import { paintGround } from '../world/ground';
import { Ambient, type LightSpot } from '../world/ambient';
import { WorldScene, type Arrival } from './WorldScene';
import type { Look } from '../characters/look';

const T = TILE;
const FONT = '"Pixelify Sans", "Courier New", monospace';

/** Copacabana, Rio de Janeiro. Day and night follow the real Rio clock (UTC-3). */
export class BrasilScene extends WorldScene {
  private ambient!: Ambient;
  private benZ?: Phaser.Time.TimerEvent;
  private gillyTalk = 0;
  private yaraTalk = 0;
  private benTalk = 0;
  private nextMacaw = 0;
  private photoBusy = false;

  constructor() {
    super('brasil');
  }

  protected build(): Arrival {
    const W = R.MAP_W * T, H = R.MAP_H * T;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H).setBackgroundColor('#2b6f86');
    paintGround(this, 'brasil-ground', { w: R.MAP_W, h: R.MAP_H, dirt: [{ x: 0, y: 0, w: R.MAP_W, h: R.MAP_H }], edgeGrass: false, base: 'sand', sea: R.SEA, seed: 17 });
    this.add.image(0, 0, 'brasil-ground').setOrigin(0).setDepth(-1000);
    this.photoBusy = false;

    const save = R.loadBrasil();
    if (!save.visited) { save.visited = true; R.saveBrasil(save); }

    const lights: LightSpot[] = [];
    this.buildCity(lights);
    this.buildBeach(lights);
    this.buildPeople();

    // edges
    this.solid(0, 0, W, 7.6 * T);           // the buildings
    this.solid(0, 0, 0.5 * T, H);
    this.solid(W - 0.5 * T, 0, 0.5 * T, H);
    this.solid(0, R.SEA * T + 12, W, H);

    this.ambient = new Ambient(this, { w: W, h: H }, lights, [], { x: 0, y: (R.SEA + 1) * T, w: W, h: (R.MAP_H - R.SEA - 1) * T }, false, undefined, -3);
    return { x: R.taxi.x * T + 44, y: R.taxi.y * T + 52, facing: 'right' };
  }

  // ---------------------------------------------------------------- city side
  private buildCity(lights: LightSpot[]) {
    const W = R.MAP_W * T;
    // sidewalk in front of the buildings, the road, and the famous wavy promenade
    const g = this.add.graphics().setDepth(-950);
    g.fillStyle(0xd8d2c4); g.fillRect(0, 0, W, 8 * T);
    g.lineStyle(1, 0xc4bdae);
    for (let x = 0; x < W; x += 24) g.lineBetween(x, 0, x, 8 * T);
    for (let y = 0; y < 8 * T; y += 24) g.lineBetween(0, y, W, y);
    g.fillStyle(0x4a4a52); g.fillRect(0, 8 * T, W, 2.5 * T);
    g.fillStyle(0xf4f1ea);
    for (let x = 8; x < W; x += 48) g.fillRect(x, 9.2 * T, 24, 3);
    g.fillStyle(0xa8a294); g.fillRect(0, 8 * T - 4, W, 4); g.fillRect(0, 10.5 * T, W, 3);
    this.add.tileSprite(0, 10.5 * T + 3, W, 96, 'br-calcadao').setOrigin(0).setDepth(-940);

    for (const [key, x] of R.BUILDINGS) {
      const img = this.add.image(x * T, 0.2 * T, key).setOrigin(0).setDepth(7.4 * T);
      lights.push({ x: x * T + 60, y: img.y + 90, size: 80 }, { x: x * T + 130, y: img.y + 140, size: 80 });
    }
    this.interactables.push(
      { id: 'apartments', at: { x: 17 * T, y: 7.9 * T }, who: 'Avenida Atlântica', lines: ['Kleurrijke flats met balkons vol planten. Uit een open raam klinkt samba.', 'Iemand op de derde verdieping hangt zijn was uit en zwaait naar je.'] },
    );

    // Sugarloaf mountain with its little cable car
    const sx = R.sugarloaf.x * T, sy = R.sugarloaf.y * T;
    this.add.image(sx, sy, 'br-sugarloaf').setOrigin(0.5, 1).setDepth(sy - 10);
    const top = new Phaser.Math.Vector2(sx, sy - 200), low = new Phaser.Math.Vector2(sx - 260, 1.2 * T);
    const cable = this.add.graphics().setDepth(sy + 1);
    cable.lineStyle(1, 0x3a3a3a).lineBetween(top.x, top.y, low.x, low.y);
    cable.fillStyle(0x6a6a6a).fillRect(low.x - 3, low.y - 4, 6, 40);
    const gondola = this.add.image(top.x, top.y, 'br-gondola').setOrigin(0.5, 0).setDepth(sy + 2);
    const st = { k: 0 };
    this.tweens.add({ targets: st, k: 1, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', hold: 1500,
      onUpdate: () => gondola.setPosition(top.x + (low.x - top.x) * st.k, top.y + (low.y - top.y) * st.k) });
    this.interactables.push({ id: 'sugarloaf', at: { x: sx - 40, y: sy + 12 }, who: 'Pão de Açúcar', lines: ['De Suikerbroodberg! Een enorme rots die uit de zee omhoog steekt.', 'Het kabelbaantje gaat helemaal naar boven. Vanaf daar zie je heel Rio liggen.'] });

    // taxi back to the airport
    const tx = R.taxi.x * T, ty = R.taxi.y * T;
    this.place('busstop', tx, ty + 30, [8, 6]);
    this.interactables.push({
      id: 'taxi', at: { x: tx + 10, y: ty + 40 }, who: 'Táxi', lines: [],
      action: () => this.say('Táxi', ['"Aeroporto? Claro! Vamos!"', 'Op naar het vliegveld. Tchau, Rio!'], () => {
        this.registry.set('flightTo', 'home'); this.registry.set('flightFrom', 'brasil'); this.registry.set('flightArrive', null);
        this.goTo('flight', { x: 0, y: 0 });
      }),
    });
  }

  // ---------------------------------------------------------------- the beach
  private buildBeach(lights: LightSpot[]) {
    R.palms.forEach(([key, x, y], i) => {
      this.add.image(x * T + 6, y * T - 2, 'glow').setTint(0x000000).setAlpha(0.18).setScale(0.45, 0.14).setDepth(-450);
      this.place(key, x * T, y * T, [14, 8]);
      if (R.toucanPalms.includes(i)) {
        const t = this.add.sprite(x * T + 10, y * T - 92, 'br-toucan', 0).setDepth(y * T + 5);
        this.time.addEvent({ delay: Phaser.Math.Between(1500, 3000), loop: true, callback: () => t.setFrame(Math.random() < 0.5 ? 0 : 1) });
        this.interactables.push({ id: `toucan-${i}`, at: { x: x * T, y: y * T + 10 }, who: 'Toekan', lines: ['Een toekan zit bovenin de palm met een snavel groter dan zijn hoofd.', 'Hij kijkt je aan alsof hij weet dat je een vogelliefhebber bent. Kroki zou jaloers zijn.'] });
      }
    });
    for (const p of R.parasols) {
      this.place('bali-parasol', p.x * T, p.y * T, [6, 4]).setTint(p.tint);
      this.place('bali-sunbed', p.x * T + 30, p.y * T + 14, [44, 8]);
    }

    // the kiosk, with flags
    const kx = R.kiosk.x * T, ky = R.kiosk.y * T;
    this.place('br-kiosk', kx, ky, [120, 30]);
    for (const fx of [kx - 76, kx + 76]) {
      const f = this.add.sprite(fx, ky, 'br-flag', 0).setOrigin(0.08, 1).setDepth(ky);
      f.play('br-flag-wave');
    }
    this.interactables.push({ id: 'kiosk', at: { x: kx, y: ky + 10 }, who: 'Quiosque', lines: [], action: () => this.kiosk() });
    lights.push({ x: kx, y: ky - 50, size: 150, colour: 0xffe0a0 });

    // açaí stand
    const ax = R.acai.x * T, ay = R.acai.y * T;
    this.place('br-acai', ax, ay, [52, 20]);
    this.interactables.push({ id: 'acai', at: { x: ax, y: ay + 10 }, who: 'Açaí', lines: R.ACAI });

    // Posto 5
    const px = R.posto.x * T, py = R.posto.y * T;
    this.place('br-posto', px, py, [44, 10]);
    this.interactables.push({ id: 'posto', at: { x: px, y: py + 10 }, who: 'Posto 5', lines: ['Posto 5: de strandwachtpost. Hier spreken ze in Rio altijd af.', 'Het perfecte plekje voor een familiefoto, zegt Gilly.'] });

    // the beach football goal
    const gx = R.goal.x * T, gy = R.goal.y * T;
    this.place('br-goal', gx, gy, [104, 8]);
    this.add.image(gx + 30, gy + 80, 'br-ball').setDepth(gy + 80);

    // sea turtles here too (they nest on Brazilian beaches)
    if (!this.anims.exists('turtle-crawl')) this.anims.create({ key: 'turtle-crawl', frames: this.anims.generateFrameNumbers('bali-turtle', { start: 0, end: 1 }), frameRate: 2, repeat: -1 });
    for (let i = 0; i < 3; i++) {
      const t = this.add.sprite(Phaser.Math.Between(4, 46) * T, Phaser.Math.Between(26, 31) * T, 'bali-turtle', 0)
        .setDepth(-470).setAlpha(0.75).setTint(0xb8e0d8).play({ key: 'turtle-crawl', frameRate: 3 });
      const go = () => {
        if (!t.active) return;
        const tx = Phaser.Math.Between(2, 50) * T, ty = Phaser.Math.FloatBetween(26, 31.5) * T;
        t.setRotation(Phaser.Math.Angle.Between(t.x, t.y, tx, ty) + Math.PI / 2);
        this.tweens.add({ targets: t, x: tx, y: ty, duration: 8000 + Phaser.Math.Distance.Between(t.x, t.y, tx, ty) * 20, onComplete: () => this.time.delayedCall(1500, go) });
      };
      go();
    }
  }

  // ---------------------------------------------------------------- the family
  private buildPeople() {
    const name = (this.registry.get('playerName') as string) || 'schat';
    const brazil = (l: Look, shirtColor: string): Look => ({ ...l, shirtColor } as Look);
    this.addVisitor('Gilly', brazil(GILLY_LOOK, 'Lemon'), [{ x: 10 * T, y: 19 * T }, { x: 14.5 * T, y: 19.4 * T }, { x: 8 * T, y: 21.5 * T }, { x: 18 * T, y: 19 * T }], () => this.gilly(name), 18);
    this.addVisitor('Yara', brazil(YARA_LOOK, 'Green'), [{ x: 36 * T, y: 18.6 * T }, { x: 40 * T, y: 18.8 * T }, { x: 38 * T, y: 20.4 * T }], () => this.yara(), 24);

    // Ben sleeps under his parasol until someone brings him something cold
    const bx = R.ben.x * T, by = R.ben.y * T;
    this.addNPC(BEN_LOOK, bx, by, 'down').then((npc) => {
      if (!this.sys.isActive()) return;
      npc.setDepth(by);
      if (!R.loadBrasil().ben) {
        this.benZ = this.time.addEvent({
          delay: 1400, loop: true, callback: () => {
            if (R.loadBrasil().ben) { this.benZ?.remove(); return; }
            const z = this.add.text(bx + 8, by - 52, 'z', { fontFamily: FONT, fontSize: '12px', color: '#ffffff', stroke: '#2a1a14', strokeThickness: 3 }).setResolution(2).setDepth(9000);
            this.tweens.add({ targets: z, x: bx + 22, y: by - 76, alpha: 0, duration: 1800, onComplete: () => z.destroy() });
          },
        });
      }
    });
    this.interactables.push({ id: 'ben', at: { x: bx, y: by + 8 }, who: 'Ben', lines: [], action: () => this.ben() });
  }

  private gilly(name: string): string[] {
    const s = R.loadBrasil();
    if (s.photo) return R.GILLY.after[this.gillyTalk++ % R.GILLY.after.length];
    if (!s.started) {
      s.started = true; R.saveBrasil(s);
      return R.GILLY.start(name);
    }
    const left: string[] = [];
    if (!s.ben) left.push('Ben slaapt nog');
    if (!s.yara) left.push('Yara wil eerst penalty\'s');
    if (left.length) return R.GILLY.waiting(left);
    this.time.delayedCall(50, () => this.dialogThen(() => this.photo()));
    return R.GILLY.ready;
  }

  /** Runs `fn` once the current text box has been read. */
  private dialogThen(fn: () => void) {
    const check = this.time.addEvent({ delay: 100, loop: true, callback: () => { if (!this.dialog.isOpen) { check.remove(); fn(); } } });
  }

  private yara(): string[] {
    const s = R.loadBrasil();
    const first = !s.penaltyGames;
    this.time.delayedCall(50, () => this.dialogThen(() => this.goTo('penalty', { x: 0, y: 0 })));
    if (s.photo && this.yaraTalk++ % 2 === 0) return [...R.YARA.after[this.yaraTalk % R.YARA.after.length], 'Kom, penalty\'s.'];
    return first ? R.YARA.intro : R.YARA.again;
  }

  private ben() {
    const s = R.loadBrasil();
    if (s.ben) { this.say('Ben', R.BEN.awake[this.benTalk++ % R.BEN.awake.length]); return; }
    if (!s.coconut) { this.say('Ben', R.BEN.asleep); return; }
    s.ben = true; R.saveBrasil(s);
    this.benZ?.remove();
    this.say('Ben', R.BEN.wake);
  }

  private kiosk() {
    const s = R.loadBrasil();
    if (s.started && !s.coconut) {
      s.coconut = true; R.saveBrasil(s);
      this.say('Quiosque', R.KIOSK.coconut);
    } else {
      this.say('Quiosque', R.KIOSK.menu);
    }
  }

  // ---------------------------------------------------------------- the family photo
  private photo() {
    if (this.photoBusy) return;
    this.photoBusy = true;
    this.registry.set('started', false);
    const px = R.posto.x * T, py = R.posto.y * T + 70;
    const cam = this.cameras.main;
    cam.fadeOut(400, 255, 255, 255);
    cam.once('camerafadeoutcomplete', () => {
      // line everybody up in front of Posto 5
      const cast: Array<[Look | null, number]> = [[BEN_LOOK, -72], [GILLY_LOOK, -36], [null, 0], [YARA_LOOK, 36]];
      const extras: Phaser.GameObjects.GameObject[] = [];
      this.player.setPosition(px, py).face('down');
      Promise.all(cast.filter(([l]) => l).map(([l, dx]) => this.addNPC(l as Look, px + dx, py, 'down'))).then((npcs) => {
        extras.push(...npcs);
        cam.stopFollow(); cam.centerOn(px, py - 40);
        cam.fadeIn(300, 255, 255, 255);
        const say = (t: string, delay: number) => this.time.delayedCall(delay, () => {
          const txt = this.add.text(px, py - 120, t, { fontFamily: FONT, fontSize: '22px', color: '#ffe27a', stroke: '#2a1a14', strokeThickness: 5 }).setOrigin(0.5).setResolution(2).setDepth(99999);
          this.tweens.add({ targets: txt, scale: 1.3, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
        });
        say('3', 600); say('2', 1400); say('1', 2200); say('XIS!', 3000);
        this.time.delayedCall(4000, () => {
          const r = this.game.renderer;
          // shoot the photo straight from the screen
          r.snapshotArea(170, 40, 300, 230, (img) => {
            cam.flash(250, 255, 255, 255);
            this.showPolaroid(img as HTMLImageElement, () => {
              extras.forEach((e) => (e as Phaser.GameObjects.Sprite).destroy());
              cam.startFollow(this.player, true, 0.15, 0.15);
              const s = R.loadBrasil(); s.photo = true; R.saveBrasil(s);
              this.registry.set('started', true);
              this.photoBusy = false;
              this.banner('A Família na Praia!', 'De familiefoto hangt nu thuis in de woonkamer.', '#c8ff9a');
            });
          });
        });
      });
    });
  }

  private showPolaroid(img: HTMLImageElement, done: () => void) {
    // save a small copy for the living room wall
    try {
      const c = document.createElement('canvas'); c.width = 300; c.height = 230;
      c.getContext('2d')!.drawImage(img, 0, 0, 300, 230);
      localStorage.setItem(R.PHOTO_KEY, c.toDataURL('image/jpeg', 0.85));
    } catch { /* no space: the photo just isn't kept */ }
    const key = `family-photo-${Date.now()}`;
    this.textures.addImage(key, img);
    const cam = this.cameras.main;
    const frame = this.add.rectangle(0, 0, 316, 280, 0xfffaf0).setStrokeStyle(2, 0xd8ccb4);
    const pic = this.add.image(0, -18, key);
    const cap = this.add.text(0, 116, 'Familie op Copacabana', { fontFamily: FONT, fontSize: '14px', color: '#3a2a20' }).setOrigin(0.5).setResolution(2);
    const date = this.add.text(0, 132, new Date().toLocaleDateString('nl-NL'), { fontFamily: FONT, fontSize: '10px', color: '#8a7a6a' }).setOrigin(0.5).setResolution(2);
    const card = this.add.container(cam.width / 2, cam.height / 2 + 10, [frame, pic, cap, date]).setScrollFactor(0).setDepth(300000).setScale(0.2).setAngle(-8);
    this.tweens.add({ targets: card, scale: 1, angle: -3, duration: 500, ease: 'Back.easeOut' });
    const close = () => {
      this.tweens.add({ targets: card, scale: 0.2, alpha: 0, duration: 300, onComplete: () => { card.destroy(); done(); } });
    };
    this.time.delayedCall(800, () => {
      const kb = this.input.keyboard!;
      const once = () => { kb.off('keydown-E', once); kb.off('keydown-SPACE', once); close(); };
      kb.on('keydown-E', once); kb.on('keydown-SPACE', once);
    });
  }

  // ---------------------------------------------------------------- birds flying over
  private updateMacaws(time: number) {
    if (time < this.nextMacaw) return;
    this.nextMacaw = time + Phaser.Math.Between(7000, 14000);
    const view = this.cameras.main.worldView;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y = Phaser.Math.Between(view.y + 30, view.y + 140);
    const m = this.add.sprite(dir > 0 ? view.x - 40 : view.right + 40, y, 'br-macaw', 0).setDepth(95000).setFlipX(dir < 0).play('br-macaw-fly');
    const pair = this.add.sprite(m.x - dir * 30, y + 14, 'br-macaw', 1).setDepth(95000).setFlipX(dir < 0).play('br-macaw-fly');
    this.tweens.add({ targets: [m, pair], x: `+=${dir * (view.width + 120)}`, y: `-=${Phaser.Math.Between(10, 50)}`, duration: 5200, onComplete: () => { m.destroy(); pair.destroy(); } });
  }

  protected tick(time: number) {
    this.ambient.update(time);
    this.updateMacaws(time);
  }
}
