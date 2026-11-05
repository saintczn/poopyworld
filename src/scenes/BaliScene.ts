import Phaser from 'phaser';
import { TILE } from '../config';
import * as B from '../content/bali';
import { paintGround } from '../world/ground';
import { Ambient, type LightSpot } from '../world/ambient';
import { WorldScene, type Arrival } from './WorldScene';

const T = TILE;
const FONT = '"Pixelify Sans", "Courier New", monospace';

/** Bali: the beach, Warung Bitterbal and Casa Umalas. Day and night follow the real Bali clock. */
export class BaliScene extends WorldScene {
  private ambient!: Ambient;
  private itemMarks = new Map<string, () => void>();
  private afterIndex = 0;

  constructor() {
    super('bali');
  }

  protected build(): Arrival {
    const W = B.MAP_W * T, H = B.MAP_H * T;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H).setBackgroundColor('#2b6f86');
    paintGround(this, 'bali-ground', {
      w: B.MAP_W, h: B.MAP_H, dirt: [...B.sand, ...B.paths], base: 'sand', sea: B.SEA, seed: 9,
    });
    this.add.image(0, 0, 'bali-ground').setOrigin(0).setDepth(-1000);

    const save = B.loadBali();
    if (!save.visited) { save.visited = true; B.saveBali(save); }

    const lights: LightSpot[] = [];
    this.buildCasa(lights);
    this.buildWarung(lights);
    this.buildBeach(lights);
    this.buildItems();

    // edges: jungle at the top and sides, the sea below (except the pier)
    this.solid(0, 0, W, 1.4 * T);
    this.solid(0, 0, 0.6 * T, H);
    this.solid(W - 0.6 * T, 0, 0.6 * T, H);
    const seaTop = B.SEA * T + 12;
    const pierL = B.pier.x * T - 22, pierR = B.pier.x * T + 22;
    this.solid(0, seaTop, pierL, H - seaTop);
    this.solid(pierR, seaTop, W - pierR, H - seaTop);
    this.solid(pierL - 8, B.pier.y * T + 186, 64, 20); // end of the pier

    // foam rolling up the shore
    const foam = this.add.graphics().setDepth(-900);
    foam.fillStyle(0xffffff, 0.7);
    for (let x = 0; x < W; x += 6) foam.fillRect(x, 0, 4 - (x % 12 === 0 ? 2 : 0), 2);
    foam.setPosition(0, B.SEA * T + 8);
    this.tweens.add({ targets: foam, y: B.SEA * T + 2, alpha: { from: 0.9, to: 0.2 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const flowers = B.bushes.filter(([k]) => k.includes('frangipani') || k.startsWith('flowers')).map(([, x, y]) => ({ x: x * T, y: y * T }));
    this.ambient = new Ambient(this, { w: W, h: H }, lights, flowers, { x: 0, y: (B.SEA + 1) * T, w: W, h: (B.MAP_H - B.SEA - 1) * T }, false, undefined, 8);
    return { x: B.taxi.x * T + 40, y: B.taxi.y * T + 22, facing: 'right' };
  }

  private buildCasa(lights: LightSpot[]) {
    const cx = B.casa.x * T, cy = B.casa.y * T;
    const casa = this.add.image(cx, cy, 'bali-casa').setOrigin(0).setDepth(cy + 222);
    this.solid(cx + 14, cy + 96, 308, 120);
    this.solid(cx, cy + 60, 336, 40);
    lights.push({ x: cx + 68, y: cy + 146, size: 90 }, { x: cx + 268, y: cy + 146, size: 90 }, { x: cx + 168, y: cy + 160, size: 130 });
    this.nameplate(cx + 168, cy + 109, 'Casa Umalas', '#4a2c18', '#c99a52', casa.depth + 1);
    this.interactables.push({ id: 'casa', at: { x: cx + 168, y: cy + 226 }, who: 'Casa Umalas', lines: B.CASA_LINES });

    // the pool with its deck
    const px = B.pool.x * T, py = B.pool.y * T;
    this.add.image(px, py, 'bali-pool').setOrigin(0).setDepth(-500);
    this.solid(px + 10, py + 10, 156, 92);
    this.interactables.push({ id: 'pool', at: { x: px + 88, y: py + 112 }, who: 'Zwembad', lines: [], action: () => this.splash(px + 88, py + 70) });
    lights.push({ x: px + 88, y: py + 56, size: 160, colour: 0x7fe0ff, always: 0.12 });

    // sun beds on the lawn
    this.place('bali-sunbed', 8.6 * T, 10.4 * T, [44, 8]);
    this.place('bali-sunbed', 8.6 * T, 11.8 * T, [44, 8]);
    this.place('bali-parasol', 10.0 * T, 11.0 * T, [6, 4]);

    // hedges around the garden, with the split gate in the middle
    const gx = B.gate.x * T, gy = B.gate.y * T;
    this.add.image(gx, gy, 'bali-gate').setOrigin(0.5, 1).setDepth(gy);
    this.solid(gx - 72, gy - 30, 56, 30);
    this.solid(gx + 16, gy - 30, 56, 30);
    for (let x = 5.2 * T; x < 19.6 * T; x += 24) {
      if (x > gx - 84 && x < gx + 72) continue;
      this.place(x % 48 < 24 ? 'bush-a' : 'bush-b', x + 12, gy - 2);
    }
    this.solid(5 * T, gy - 26, gx - 72 - 5 * T, 24);
    this.solid(gx + 72, gy - 26, 19.6 * T - gx - 72, 24);
    for (let y = 8.6 * T; y < gy - 20; y += 24) {
      this.place('bush-a', 5.2 * T, y + 12);
      this.place('bush-b', 19.4 * T, y + 12);
    }
    this.solid(4.6 * T, 8.2 * T, 24, gy - 8.2 * T);
    this.solid(19.0 * T, 8.2 * T, 24, gy - 8.2 * T);
    this.interactables.push({ id: 'gate', at: { x: gx, y: gy + 8 }, who: 'Candi bentar', lines: ['Een gespleten poort van zwart lavasteen, zoals bij tempels op Bali.', 'Op de treden liggen kleine offerbakjes met bloemen en wierook. Het ruikt naar frangipani.'] });
  }

  private buildWarung(lights: LightSpot[]) {
    const wx = B.warung.x * T, wy = B.warung.y * T;
    const back = this.add.image(wx, wy, 'bali-warung').setOrigin(0).setDepth(wy + 110);
    // the counter is drawn again on top, so Bram can stand behind it
    this.add.image(wx, wy, 'bali-warung').setOrigin(0).setCrop(0, 120, 208, 56).setDepth(wy + 176);
    this.solid(wx + 4, wy + 64, 200, 104);
    this.nameplate(wx + 104, wy + 64, 'Warung Bitterbal', '#ffe27a', '#8a5a34', back.depth + 80);
    lights.push({ x: wx + 50, y: wy + 100, size: 120, flicker: true }, { x: wx + 160, y: wy + 100, size: 120, flicker: true });
    for (const [i, x] of [26, 92, 180].entries()) this.place(`barstool-${[0, 5, 2][i]}`, wx + x, wy + 194);

    this.addNPC(B.BRAM_LOOK, wx + 104, wy + 138, 'down').then((npc) => {
      if (!this.sys.isActive()) return;
      npc.setDepth(wy + 138);
    });
    this.interactables.push({ id: 'bram', at: { x: wx + 104, y: wy + 184 }, who: 'Bram', lines: [], action: () => this.talkBram() });
    this.interactables.push({
      id: 'menu', at: { x: wx + 170, y: wy + 184 }, who: 'Menukaart',
      lines: ['WARUNG BITTERBAL', 'Bitterballen (8 st.) — 40.000 rupiah', 'Bitterbal Sambal Special — vraag Bram', 'Nasi goreng met bitterbal — 45.000', 'Kokosnoot vers van de boom — 20.000', 'Aardbeien — NEE.'],
    });
  }

  private buildBeach(lights: LightSpot[]) {
    for (const [key, x, y] of B.palms) {
      this.add.image(x * T + 6, y * T - 2, 'glow').setTint(0x000000).setAlpha(0.18).setScale(0.45, 0.14).setDepth(-450);
      this.place(key, x * T, y * T, [14, 8]);
    }
    for (const [key, x, y] of B.bushes) this.place(key, x * T, y * T);
    for (const p of B.beach) this.place(p.key, p.x * T, p.y * T, p.solid);
    for (const [x, y] of B.torches) {
      this.place('bali-torch', x * T, y * T, [6, 4]);
      lights.push({ x: x * T, y: y * T - 46, size: 110, flicker: true, colour: 0xffa04a });
    }
    for (const [x, y, flip] of B.boats) {
      const boat = this.place('bali-jukung', x * T, y * T, undefined, flip);
      this.tweens.add({ targets: boat, y: y * T + 2, duration: 1600 + x * 10, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.interactables.push({ id: 'boat', at: { x: 36 * T, y: 24.6 * T }, who: 'Jukung', lines: ['Een traditioneel vissersbootje met grote ogen op de punt, zodat het de weg over zee kan zien.'] });

    // the pier, with a fishing spot at the end
    const px = B.pier.x * T, py = B.pier.y * T;
    this.add.image(px, py, 'bali-pier').setOrigin(0.5, 0).setDepth(-480);
    this.interactables.push({ id: 'fish', at: { x: px, y: py + 186 }, who: 'Steiger', lines: [], action: () => this.startFishing() });

    // the taxi stand: the way home
    const tx = B.taxi.x * T, ty = B.taxi.y * T;
    this.place('busstop', tx, ty + 24, [8, 6]);
    this.interactables.push({
      id: 'taxi', at: { x: tx + 10, y: ty + 30 }, who: 'Taxi naar het vliegveld', lines: [],
      action: () => this.say('Taxi', ['"Bandara? Airport? Ja, ja, kom maar!"', 'De taxi brengt jullie naar het vliegveld. Op naar huis...'], () => this.fly('home')),
    });
  }

  private buildItems() {
    const save = B.loadBali();
    for (const it of B.ITEMS) {
      if (save.found.includes(it.id) || save.done) continue;
      const x = it.x * T, y = it.y * T;
      const img = this.add.image(x, y, it.tex).setOrigin(0.5, 1).setDepth(y);
      const entry = {
        id: `item-${it.id}`, at: { x, y: y - 4 }, who: it.name, lines: [] as string[],
        action: () => {
          const s = B.loadBali();
          if (!s.started) { this.say(it.name, ['Een ' + it.name.toLowerCase() + '? Wat doet die hier nou?', 'Misschien weet iemand bij de warung van wie dit is.']); return; }
          s.found.push(it.id); B.saveBali(s);
          img.destroy(); this.itemMarks.get(it.id)?.(); entry.at.y = -9999;
          const left = B.ITEMS.length - s.found.length;
          this.say(it.name, [it.found, left ? `Nog ${left} te gaan.` : 'Dat was het laatste! Snel terug naar Bram.']);
        },
      };
      this.interactables.push(entry);
      if (save.started) this.itemMarks.set(it.id, this.sparkle(x, y - 6));
    }
  }

  private talkBram() {
    const s = B.loadBali();
    if (s.done) {
      this.say('Bram', B.BRAM.after[this.afterIndex++ % B.BRAM.after.length]);
    } else if (!s.started) {
      this.say('Bram', B.BRAM.hello, () => {
        const n = B.loadBali(); n.started = true; B.saveBali(n);
        for (const it of B.ITEMS) if (!n.found.includes(it.id) && !this.itemMarks.has(it.id)) this.itemMarks.set(it.id, this.sparkle(it.x * T, it.y * T - 6));
      });
    } else if (s.found.length < B.ITEMS.length) {
      this.say('Bram', B.BRAM.busy(B.ITEMS.length - s.found.length));
    } else {
      this.say('Bram', B.BRAM.done, () => {
        const n = B.loadBali(); n.done = true; B.saveBali(n);
        this.cameras.main.flash(300, 255, 230, 160);
        this.banner('Bali: het geheime recept', 'De Bitterbal Sambal Special is geboren!\nBij Warung Bitterbal eten jullie voortaan gratis.');
      });
    }
  }

  /** Plons! */
  private splash(x: number, y: number) {
    this.player.halt();
    for (let i = 0; i < 18; i++) {
      const d = this.add.image(x + Phaser.Math.Between(-20, 20), y, 'dot').setTint(0xcff6ff).setScale(Phaser.Math.FloatBetween(1, 2.2)).setDepth(y + 50);
      this.tweens.add({
        targets: d, x: d.x + Phaser.Math.Between(-30, 30), y: y - Phaser.Math.Between(20, 50), duration: 380, ease: 'Quad.easeOut', yoyo: true,
        onComplete: () => d.destroy(),
      });
    }
    this.say('Zwembad', ['Je doet je voeten in het water. Lekker koel!', 'Precies goed na een hele dag in de zon.']);
  }

  /** A wooden sign with text, centred at (x, y). */
  private nameplate(x: number, y: number, text: string, colour: string, board: string, depth: number) {
    const t = this.add.text(x, y, text, { fontFamily: FONT, fontSize: '12px', color: colour, stroke: '#2a1a14', strokeThickness: 3 })
      .setOrigin(0.5).setResolution(2).setDepth(depth + 1);
    const w = Math.ceil(t.width) + 12, h = 18;
    const g = this.add.graphics().setDepth(depth);
    g.fillStyle(0x2a1a14); g.fillRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(board).color); g.fillRect(x - w / 2, y - h / 2, w, h);
  }

  private fly(to: 'home' | 'bali') {
    this.registry.set('flightTo', to);
    this.registry.set('flightArrive', null);
    this.goTo('flight', { x: 0, y: 0 });
  }

  protected tick(time: number) {
    this.ambient.update(time);
  }
}
