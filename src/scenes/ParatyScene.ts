import Phaser from 'phaser';
import { TILE } from '../config';
import * as P from '../content/paraty';
import { paintGround, rng } from '../world/ground';
import { Ambient, type LightSpot } from '../world/ambient';
import { randomLook } from '../characters/look';
import { askChoice } from '../ui/memories';
import { WorldScene, type Arrival } from './WorldScene';

const T = TILE;
const FONT = '"Pixelify Sans", "Courier New", monospace';

/** Paraty, on the Costa Verde of Brazil. Real Brazil time, real-ish tides. */
export class ParatyScene extends WorldScene {
  private ambient!: Ambient;
  private flood!: Phaser.GameObjects.Rectangle;
  private busy = false;
  private lurdes = 0;

  constructor() {
    super('paraty');
  }

  protected build(): Arrival {
    const W = P.MAP_W * T, H = P.MAP_H * T;
    this.busy = false;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H).setBackgroundColor('#2b6f86');
    paintGround(this, 'paraty-ground', {
      w: P.MAP_W, h: P.MAP_H, seed: 23, sea: P.SEA,
      dirt: [{ x: 5, y: 4, w: 36, h: 23 }, { x: 0, y: P.SEA - 1, w: P.MAP_W, h: 12 }],
    });
    this.add.image(0, 0, 'paraty-ground').setOrigin(0).setDepth(-1000);
    for (const r of P.stones) this.add.tileSprite(r.x * T, r.y * T, r.w * T, r.h * T, 'br-stones').setOrigin(0).setDepth(-950);
    // the mountains behind the town
    this.add.tileSprite(0, 0, W, 176, 'br-serra').setOrigin(0).setDepth(-940);
    this.solid(0, 0, W, 4.4 * T);

    const save = P.loadParaty();
    if (!save.visited) { save.visited = true; P.saveParaty(save); }

    const lights: LightSpot[] = [];
    this.buildTown(lights);
    this.buildWater();
    this.buildNature();
    this.buildPeople();

    this.solid(0, 0, 0.4 * T, H); this.solid(W - 0.4 * T, 0, 0.4 * T, H);
    this.solid(0, P.SEA * T + 12, W, H);

    this.ambient = new Ambient(this, { w: W, h: H }, lights, [], { x: 0, y: (P.SEA + 1) * T, w: W, h: (P.MAP_H - P.SEA - 1) * T }, false, undefined, -3);
    return { x: P.busStop.x * T - 30, y: P.busStop.y * T + 40, facing: 'left' };
  }

  // ---------------------------------------------------------------- town
  private buildTown(lights: LightSpot[]) {
    for (const [key, x, y] of P.HOUSES) {
      const img = this.add.image(x * T, y * T, key).setOrigin(0).setDepth(y * T + 150);
      this.solid(x * T + 4, y * T + 40, img.width - 8, img.height - 46);
      lights.push({ x: x * T + 40, y: y * T + 110, size: 70 }, { x: x * T + 120, y: y * T + 110, size: 70 });
    }
    this.interactables.push({ id: 'doors', at: { x: 9.5 * T, y: 10.4 * T }, who: 'Gekleurde deuren', lines: ['Elk huis is wit, maar elke deur en elk raamkozijn heeft een eigen kleur: blauw, geel, groen, rood.', 'Zo kon je vroeger, zonder huisnummers, toch iemand vinden: "het huis met de groene deur".'] });

    // the church of Santa Rita
    const cx = P.church.x * T, cy = P.church.y * T;
    this.add.image(cx, cy, 'br-church').setOrigin(0).setDepth(cy + 236);
    this.solid(cx + 4, cy + 50, 192, 180);
    lights.push({ x: cx + 75, y: cy + 200, size: 120, colour: 0xfff1c8 }, { x: cx + 167, y: cy + 80, size: 80, colour: 0xffd080 });
    this.interactables.push({ id: 'igreja', at: { x: cx + 75, y: cy + 244 }, who: 'Igreja de Santa Rita', lines: [], action: () => this.say('Igreja de Santa Rita', P.CHURCH, () => this.stamp('igreja')) });

    // the bus stop back to Rio
    const bx = P.busStop.x * T, by = P.busStop.y * T;
    this.place('busstop', bx, by + 24, [8, 6]);
    this.place('sign', bx - 70, by + 22, [12, 8]);
    this.interactables.push({ id: 'welcome', at: { x: bx - 70, y: by + 34 }, who: 'Bordje', lines: P.WELCOME });
    this.interactables.push({
      id: 'bus', at: { x: bx + 10, y: by + 34 }, who: 'Rodoviária', lines: [],
      action: () => askChoice('Waar wil je heen?', 'Bus vanaf Paraty.', ['Rio de Janeiro (Copacabana)', 'Het vliegveld (naar huis)'], (i) => {
        if (i === 0) this.travel('brasil', { x: 3.6 * T, y: 11.8 * T, facing: 'right' });
        if (i === 1) {
          this.registry.set('flightTo', 'home'); this.registry.set('flightFrom', 'brasil'); this.registry.set('flightArrive', null);
          this.goTo('flight', { x: 0, y: 0 });
        }
      }),
    });

    // the sweets stall
    const dx = P.doces.x * T, dy = P.doces.y * T;
    this.place('br-doces', dx, dy, [64, 20]);
    this.interactables.push({ id: 'doces', at: { x: dx, y: dy + 10 }, who: 'Dona Lurdes', lines: [], action: () => {
      this.say('Dona Lurdes', this.lurdes === 0 ? P.LURDES.first : P.LURDES.more[(this.lurdes - 1) % P.LURDES.more.length]);
      this.lurdes++;
    } });

    // lanterns along the streets
    for (const [x, y] of [[11.6, 11.6], [21.4, 11.6], [31.4, 11.6], [16.8, 20.8], [27.4, 20.8], [38.4, 12]]) {
      this.place('lamp', x * T, y * T, [8, 6]);
      lights.push({ x: x * T, y: y * T - 40, size: 110, flicker: true });
    }
  }

  // ---------------------------------------------------------------- the bay
  private buildWater() {
    const W = P.MAP_W * T;
    // the tide creeps into the lower streets
    this.flood = this.add.rectangle(5 * T, 20.6 * T, 36 * T, 5.4 * T, 0x4aa8c8).setOrigin(0).setDepth(-930).setAlpha(0);
    this.place('sign', 33 * T, 24.6 * T, [12, 8]);
    this.interactables.push({ id: 'tide', at: { x: 33 * T, y: 24.9 * T }, who: 'Bordje: Maré', lines: [], action: () => this.say('Maré (getij)', P.TIDE_SIGN(P.tide() > 0.6)) });

    // a little quay edge
    const q = this.add.graphics().setDepth(-920);
    q.fillStyle(0x7e7468); q.fillRect(5 * T, P.SEA * T - 6, 36 * T, 6);

    // islands far out in the bay
    for (const [x, y, r] of P.islands) {
      const g = this.add.graphics().setDepth(-460);
      g.fillStyle(0xe8d39a); g.fillEllipse(x * T, y * T, r * 2 + 14, r + 10);
      g.fillStyle(0x2f6b2a); g.fillEllipse(x * T, y * T - 6, r * 2, r);
      g.fillStyle(0x3c7a30); g.fillEllipse(x * T - r / 3, y * T - 12, r, r / 2);
    }
    for (const [key, x, y] of P.boats) {
      const b = this.add.image(x * T, y * T, key).setOrigin(0.5, 0.85).setDepth(-300);
      this.tweens.add({ targets: b, y: y * T + 3, angle: { from: -1.2, to: 1.2 }, duration: 1800 + x * 30, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    for (const [x, y] of P.canoes) {
      const c = this.add.image(x * T, y * T, 'br-canoe').setDepth(-300);
      this.tweens.add({ targets: c, y: y * T + 2, duration: 1500 + x * 20, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const foam = this.add.graphics().setDepth(-900);
    foam.fillStyle(0xffffff, 0.6);
    for (let x = 0; x < W; x += 6) foam.fillRect(x, 0, 3, 2);
    foam.setPosition(0, P.SEA * T + 6);
    this.tweens.add({ targets: foam, y: P.SEA * T + 1, alpha: { from: 0.8, to: 0.2 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // the captain and the boat trip
    this.interactables.push({ id: 'escuna', at: { x: P.captain.x * T, y: P.captain.y * T + 10 }, who: 'Seu Zé', lines: [], action: () => {
      this.say('Seu Zé', P.CAPTAIN.ask, () => this.boatTrip());
    } });
  }

  // ---------------------------------------------------------------- jungle, waterfall, birds
  private buildNature() {
    const wx = P.waterfall.x * T, wy = P.waterfall.y * T;
    const fall = this.add.sprite(wx, wy, 'br-waterfall', 0).setOrigin(0).setDepth(wy + 230).play('br-waterfall-flow');
    this.solid(wx, wy, 160, 240);
    this.solid(wx + 10, wy + 236, 140, 40);
    this.interactables.push({ id: 'tobogã', at: { x: wx + 80, y: wy + 296 }, who: 'Cachoeira do Tobogã', lines: [], action: () => this.say('Cachoeira do Tobogã', P.SLIDE.ask, () => this.slide(wx + 80, wy)) });
    void fall;

    // trees, flowers and hummingbirds around the edges
    const r = rng(77);
    for (const [key, x, y] of [['tree-a', 3, 15], ['tree-c', 1.6, 20.6], ['tree-b', 43.4, 6.2], ['tree-a', 44, 17.4], ['tree-c', 42.4, 22.2], ['tree-b', 3.4, 24.6]] as const) this.place(key, x * T, y * T, [24, 12]);
    const flowerSpots = [[2.4, 13], [4.8, 17.6], [44.2, 9.8], [41.6, 15], [43.8, 20.4], [5, 22]];
    flowerSpots.forEach(([x, y], i) => {
      this.place(`flowers-big-${(i * 3) % 9}`, x * T, y * T);
      const h = this.add.sprite(x * T + 6, y * T - 22, 'br-hummingbird', 0).setDepth(y * T + 40).play('br-hummingbird-hover');
      const hover = () => {
        if (!h.active) return;
        const tx = x * T + (r() - 0.5) * 50, ty = y * T - 14 - r() * 26;
        h.setFlipX(tx < h.x);
        this.tweens.add({ targets: h, x: tx, y: ty, duration: 250 + r() * 300, ease: 'Quad.easeOut', onComplete: () => this.time.delayedCall(300 + r() * 1400, hover) });
      };
      hover();
    });
    this.interactables.push({ id: 'beija-flor', at: { x: 4.8 * T, y: 17.9 * T }, who: 'Kolibrie', lines: ['Een beija-flor, een kolibrie, hangt stil in de lucht bij een bloem.', 'Zijn vleugels gaan zo snel dat je ze niet eens ziet. Bzzzz.'] });

    // the square: a big tree full of green parakeets
    const px = P.praca.x * T, py = P.praca.y * T;
    this.place('tree-a', px, py, [24, 12]);
    for (let i = 0; i < 6; i++) {
      const k = this.add.sprite(px - 36 + i * 15, py - 70 - (i % 3) * 14, 'kroki', 0).setDepth(py + 40).setScale(0.7).setFlipX(i % 2 === 0);
      k.play({ key: 'kroki-idle', startFrame: i % 4 });
      this.time.addEvent({ delay: 1800 + i * 300, loop: true, callback: () => { k.play('kroki-flap'); this.time.delayedCall(500, () => k.play('kroki-idle')); } });
    }
    this.interactables.push({ id: 'periquitos', at: { x: px, y: py + 12 }, who: 'Periquitos', lines: [], action: () => this.say('Periquitos', P.PARAKEETS, () => this.stamp('periquitos')) });
  }

  private buildPeople() {
    const r = rng(99);
    const spots = [[10, 12], [20, 12.2], [30, 11.8], [14, 21.2], [26, 21.4], [36, 23.6], [8, 23.8]].map(([x, y]) => ({ x: x * T, y: y * T }));
    P.LOCALS.forEach((l, i) => {
      this.addVisitor(l.name, randomLook(r), [spots[i * 2], spots[(i * 2 + 3) % spots.length], spots[(i + 5) % spots.length]], () => l.lines, 20 + i * 4);
    });
    // the captain stands on the quay
    this.addNPC(randomLook(rng(5)), P.captain.x * T, P.captain.y * T, 'down');
  }

  // ---------------------------------------------------------------- stamps
  private stamp(id: string) {
    const s = P.loadParaty();
    if (s.stamps.includes(id)) return;
    s.stamps.push(id); P.saveParaty(s);
    this.showCard(id);
    if (s.stamps.length === P.STAMPS.length) {
      this.time.delayedCall(2600, () => this.banner('Paratiense de verdade!', 'Alle vier de stempels van Paraty. Je hoort er helemaal bij.', '#c8ff9a'));
    }
  }

  private showCard(fresh: string) {
    const s = P.loadParaty();
    const cam = this.cameras.main;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const bg = this.add.graphics();
    bg.fillStyle(0xfff6dc); bg.fillRoundedRect(-150, -52, 300, 104, 8);
    bg.lineStyle(3, 0x2f8a4a); bg.strokeRoundedRect(-150, -52, 300, 104, 8);
    parts.push(bg, this.add.text(0, -40, 'Stempelkaart Paraty', { fontFamily: FONT, fontSize: '13px', color: '#2f6a3a' }).setOrigin(0.5).setResolution(2));
    P.STAMPS.forEach((st, i) => {
      const x = -108 + i * 72, y = 6;
      const has = s.stamps.includes(st.id);
      const ring = this.add.circle(x, y, 24, has ? 0xffe2e2 : 0xf0e8d4).setStrokeStyle(2, has ? 0xc0392b : 0xc8bca0);
      const ico = this.add.text(x, y - 2, has ? st.icon : '?', { fontSize: '20px', color: '#8a7a6a' }).setOrigin(0.5);
      const name = this.add.text(x, y + 32, st.short, { fontFamily: FONT, fontSize: '8px', color: '#5a4a3a' }).setOrigin(0.5).setResolution(2);
      parts.push(ring, ico, name);
      if (st.id === fresh) { ring.setScale(2).setAlpha(0); this.tweens.add({ targets: ring, scale: 1, alpha: 1, duration: 400, delay: 300, ease: 'Back.easeOut' }); }
    });
    const card = this.add.container(cam.width / 2, 110, parts).setScrollFactor(0).setDepth(250000).setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 250, hold: 2200, yoyo: true, onComplete: () => card.destroy() });
  }

  // ---------------------------------------------------------------- the waterslide
  private slide(x: number, top: number) {
    if (this.busy) return;
    this.busy = true;
    this.registry.set('started', false);
    const p = this.player;
    const cam = this.cameras.main;
    cam.fadeOut(250);
    cam.once('camerafadeoutcomplete', () => {
      p.setPosition(x, top + 20).setDepth(top + 400).face('down');
      cam.fadeIn(250);
      this.tweens.add({
        targets: p, y: top + 250, duration: 1300, ease: 'Quad.easeIn',
        onUpdate: () => { p.x = x + Math.sin(p.y / 18) * 6; p.setDepth(top + 400); },
        onComplete: () => {
          for (let i = 0; i < 24; i++) {
            const d = this.add.image(x + Phaser.Math.Between(-20, 20), top + 250, 'dot').setTint(0xe8f8ff).setScale(Phaser.Math.FloatBetween(1, 2.4)).setDepth(top + 410);
            this.tweens.add({ targets: d, x: d.x + Phaser.Math.Between(-36, 36), y: top + 250 - Phaser.Math.Between(10, 46), alpha: 0, duration: 600, onComplete: () => d.destroy() });
          }
          cam.shake(200, 0.006);
          this.time.delayedCall(700, () => {
            p.setPosition(x, top + 300);
            this.registry.set('started', true);
            this.busy = false;
            this.say('Cachoeira do Tobogã', P.SLIDE.after, () => this.stamp('tobogã'));
          });
        },
      });
    });
  }

  // ---------------------------------------------------------------- the boat trip
  private boatTrip() {
    if (this.busy) return;
    this.busy = true;
    this.registry.set('started', false);
    const cam = this.cameras.main;
    const p = this.player;
    const back = { x: p.x, y: p.y };
    cam.fadeOut(400);
    cam.once('camerafadeoutcomplete', () => {
      p.setVisible(false);
      cam.stopFollow();
      const y = 30.2 * T;
      const boat = this.add.image(-3 * T, y + T, 'br-escuna-a').setOrigin(0.5, 0.85).setDepth(-250);
      const rider = this.add.sprite(-3 * T, y + T - 30, p.texture.key, p.frame.name).setOrigin(0.5, 61 / 64).setDepth(-249);
      cam.centerOn(4 * T, y);
      cam.fadeIn(400);
      const caption = this.add.text(320, 300, 'Passeio de escuna... langs de eilandjes van de baai van Paraty', { fontFamily: FONT, fontSize: '12px', color: '#fff6dc', stroke: '#1a3a48', strokeThickness: 4 })
        .setOrigin(0.5).setScrollFactor(0).setDepth(200000).setResolution(2);
      // dolphins and a turtle say hello along the way
      [[12, 31.4], [26, 30.8], [36, 31.6]].forEach(([dx, dy], i) => this.time.delayedCall(1600 + i * 2200, () => {
        const d = this.add.image(dx * T, dy * T, i === 1 ? 'bali-turtle' : 'bali-dolphin', 0).setDepth(-240).setFlipX(true);
        if (i === 1) { d.setAlpha(0.8).setTint(0xb8e0d8); this.tweens.add({ targets: d, x: d.x - 60, duration: 3000, onComplete: () => d.destroy() }); return; }
        const st = { k: 0 };
        this.tweens.add({ targets: st, k: 1, duration: 1100, onUpdate: () => d.setPosition(dx * T - 70 * st.k, dy * T - Math.sin(st.k * Math.PI) * 34).setRotation(-(st.k - 0.5) * 1.4), onComplete: () => d.destroy() });
      }));
      this.tweens.add({
        targets: [boat, rider], x: `+=${44 * T}`, duration: 8500, ease: 'Sine.easeInOut',
        onUpdate: () => { cam.centerOn(Math.max(boat.x + 120, 10 * T), y); rider.y = boat.y - 30; },
        onComplete: () => {
          cam.fadeOut(400);
          cam.once('camerafadeoutcomplete', () => {
            boat.destroy(); rider.destroy(); caption.destroy();
            p.setVisible(true).setPosition(back.x, back.y);
            cam.startFollow(p, true, 0.15, 0.15);
            cam.fadeIn(400);
            this.registry.set('started', true);
            this.busy = false;
            this.say('Seu Zé', P.CAPTAIN.after, () => this.stamp('escuna'));
          });
        },
      });
      this.tweens.add({ targets: boat, y: y + 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }

  protected tick(time: number) {
    this.ambient.update(time);
    // the tide: water slides over the lower streets
    const t = P.tide();
    const target = t > 0.6 ? (t - 0.6) / 0.4 * 0.42 : 0;
    this.flood.setAlpha(target);
  }
}
