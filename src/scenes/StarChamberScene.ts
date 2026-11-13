import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { loadMystery, saveMystery, FINALE } from '../content/mystery';
import { loadDates } from '../world/season';
import { confetti } from '../world/festive';
import type { Look } from '../characters/look';

const FONT = '"Pixelify Sans", "Courier New", monospace';
const C = { x: 320, y: 230 };

/** The names the star is named after: both birthdays from the Hub if filled in, otherwise the player. */
export function starName(player: string) {
  const names = loadDates().birthdays.map((b) => b.name).filter(Boolean);
  if (names.length >= 2) return `${names[0]} & ${names[1]}`;
  if (names.length === 1 && names[0] !== player) return `${player} & ${names[0]}`;
  return `${player} & haar lief`;
}

/** The Star Chamber deep under the hill: the end of the Secret of Hollowmere. */
export class StarChamberScene extends WorldScene {
  private sky!: Phaser.GameObjects.Graphics;
  private busy = false;

  constructor() {
    super('starchamber');
  }

  protected build(): Arrival {
    const save = loadMystery();
    this.busy = false;
    this.physics.world.setBounds(0, 0, 640, 448);
    this.cameras.main.setBackgroundColor('#06040c').setBounds(0, 0, 640, 448);

    // the round chamber: a vault of painted stars, a circular floor
    const g = this.add.graphics().setDepth(-1000);
    g.fillStyle(0x14102a); g.fillRect(0, 0, 640, 448);
    for (let i = 0; i < 140; i++) { g.fillStyle(0xe8e0c0, Math.random() * 0.7 + 0.2); g.fillRect((i * 137) % 640, (i * 71) % 200, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1); }
    g.fillStyle(0x2a2440); g.fillEllipse(C.x, C.y + 60, 560, 300);
    g.fillStyle(0x3a3456); g.fillEllipse(C.x, C.y + 50, 520, 270);
    g.lineStyle(2, 0xc9a040, 0.6); g.strokeEllipse(C.x, C.y + 50, 440, 220);
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2;
      g.fillStyle(0xc9a040, 0.8); g.fillCircle(C.x + Math.cos(a) * 220, C.y + 50 + Math.sin(a) * 110, 3);
    }
    this.sky = this.add.graphics().setDepth(-999).setAlpha(save.finale ? 1 : 0);
    this.drawSky();
    // walls of the chamber
    this.solid(0, 0, 640, 120);
    this.solid(0, 0, 60, 448); this.solid(580, 0, 60, 448);
    this.solid(0, 400, 280, 48); this.solid(360, 400, 280, 48);

    // the dais
    this.add.image(C.x, C.y + 30, 'hm-dais').setOrigin(0.5, 1).setDepth(C.y + 30);
    this.solid(C.x - 52, C.y, 104, 26);
    if (save.finale) this.placedSeals(true);
    this.interactables.push({ id: 'dais', at: { x: C.x, y: C.y + 46 }, who: 'Sokkel', lines: [], action: () => this.finale() });
    for (const x of [120, 520]) {
      this.add.sprite(x, 200, 'hm-brazier', 0).setOrigin(0.5, 1).play('hm-brazier-burn').setDepth(200);
      this.add.image(x, 180, 'glow').setScale(0.9).setTint(0xffb050).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setDepth(90000);
    }
    if (!save.finale) this.time.delayedCall(500, () => this.say('Sterrenkamer', FINALE.enter));
    return { x: 320, y: 380, facing: 'up' };
  }

  private drawSky() {
    const g = this.sky; g.clear();
    g.fillStyle(0x0a1030); g.fillRect(0, 0, 640, 140);
    for (let i = 0; i < 90; i++) { g.fillStyle(0xffffff, 0.4 + (i % 5) * 0.12); g.fillRect((i * 53) % 640, (i * 37) % 130, 1, 1); }
    // their star
    g.fillStyle(0xfff4c0); g.fillCircle(320, 48, 4);
    g.lineStyle(1, 0xfff4c0, 0.8); g.lineBetween(320, 34, 320, 62); g.lineBetween(306, 48, 334, 48);
  }

  private placedSeals(instant = false) {
    const spots = [[-30, -8], [0, -18], [30, -8], [0, 2]];
    ['seals:seal-gold', 'hm-seal-owl', 'hm-seal-cat', 'hm-seal-stag'].forEach((key, i) => {
      const [tex, frame] = key.includes(':') ? key.split(':') : [key, undefined];
      const img = this.add.image(C.x + spots[i][0], C.y + spots[i][1], tex, frame).setScale(tex === 'seals' ? 0.28 : 0.42).setDepth(C.y + 40);
      if (!instant) {
        img.setPosition(this.player.x, this.player.y - 30).setAlpha(0);
        this.tweens.add({ targets: img, x: C.x + spots[i][0], y: C.y + spots[i][1], alpha: 1, duration: 900, delay: i * 500, ease: 'Sine.easeInOut' });
      }
      const glow = this.add.image(img.x, img.y, 'glow').setScale(0.3).setTint([0xffe27a, 0xc8d8ff, 0xffb070, 0xa8f0c8][i]).setBlendMode(Phaser.BlendModes.ADD).setDepth(90001).setAlpha(instant ? 0.7 : 0);
      if (!instant) { glow.setPosition(C.x + spots[i][0], C.y + spots[i][1]); this.tweens.add({ targets: glow, alpha: 0.8, delay: i * 500 + 900, duration: 400 }); }
    });
  }

  private finale() {
    const m = loadMystery();
    if (m.finale) { this.say('Sokkel', ['De vier zegels gloeien zacht in hun holtes.', 'Boven je straalt jullie ster.']); return; }
    if (this.busy) return;
    this.busy = true;
    const name = (this.registry.get('playerName') as string) || 'jullie';
    const star = starName(name);
    this.say('Sterrenkamer', FINALE.place, () => {
      this.placedSeals();
      this.time.delayedCall(2800, () => {
        this.cameras.main.flash(600, 200, 220, 255);
        // a beam of light, and Odile steps out of it
        const beam = this.add.image(C.x, C.y - 80, 'glow').setScale(1.2, 3).setTint(0xc8d8ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(90002).setAlpha(0);
        this.tweens.add({ targets: beam, alpha: 0.8, duration: 1200 });
        const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
        const odile = { body: 'f', skin: 'Porcelain', eyes: 'Blue', hair: 'bun', hairColor: 'Platinum', beard: 'none', shirt: 'longsleeve', shirtColor: 'White', legs: 'pants', legsColor: 'White', shoes: 'shoes', shoesColor: 'White' } as Look;
        install(odile).then((key) => {
          const o = this.add.sprite(C.x + 70, C.y + 20, `${key}-idle`, 6).setOrigin(0.5, 61 / 64).play(`${key}-idle-down`).setTint(0xa8c8ff).setAlpha(0).setDepth(C.y + 20).setBlendMode(Phaser.BlendModes.SCREEN);
          this.tweens.add({ targets: o, alpha: 0.85, duration: 1500 });
          this.tweens.add({ targets: o, y: o.y - 3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          this.time.delayedCall(1600, () => this.say('Odile Hollow', FINALE.odile(star), () => {
            // Grauw comes in through the entrance
            const grauw = { body: 'm', skin: 'Porcelain', eyes: 'Gray', hair: 'none', hairColor: 'Gray', beard: 'mustache', shirt: 'longsleeve', shirtColor: 'Black', legs: 'pants', legsColor: 'Charcoal', shoes: 'boots', shoesColor: 'Black' } as Look;
            install(grauw).then((gk) => {
              const gs = this.add.sprite(320, 440, `${gk}-walk`, 0).setOrigin(0.5, 61 / 64).play(`${gk}-walk-up`).setDepth(400);
              this.tweens.add({ targets: gs, y: 360, duration: 1800, onComplete: () => {
                gs.play(`${gk}-idle-up`);
                this.say('Grauw', FINALE.grauw, () => this.ending(star, [o, beam]));
              } });
            });
          }));
        });
      });
    });
  }

  private ending(star: string, fade: Phaser.GameObjects.GameObject[]) {
    const m = loadMystery(); m.finale = true; saveMystery(m);
    // the ceiling opens: the real night sky
    this.tweens.add({ targets: this.sky, alpha: 1, duration: 2500 });
    this.cameras.main.shake(1200, 0.004);
    this.time.delayedCall(2600, () => {
      this.say('De Ster', FINALE.end(star), () => {
        this.tweens.add({ targets: fade, alpha: 0, duration: 2000 });
        confetti(this, 320, 60, 80);
        this.credits(star);
      });
    });
  }

  private credits(star: string) {
    this.registry.set('started', false);
    const lines = [
      'HET GEHEIM VAN HOLLOWMERE', '', 'EINDE', '', '',
      `Opgedragen aan ${star}`, '', 'die nooit opgaven,', 'niet voor Grauw,', 'niet voor de Lantaarnkring,', 'en niet voor elkaar.', '', '',
      'Odile Hollow — sterrenkundige', 'Meneer Grauw — huisbewaarder', 'De Lantaarnkring — het licht bewaard', '', '',
      'Kijk af en toe omhoog.', 'Vanuit de tuin van jullie villa', 'zie je de ster het best.', '', '', '♥',
    ];
    const bg = this.add.rectangle(0, 0, 640, 360, 0x06040c, 0).setOrigin(0).setScrollFactor(0).setDepth(300000);
    this.tweens.add({ targets: bg, fillAlpha: 0.88, duration: 1500 });
    const t = this.add.text(320, 380, lines.join('\n'), { fontFamily: FONT, fontSize: '14px', color: '#fff4c0', align: 'center', lineSpacing: 6 })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(300001).setResolution(2);
    this.tweens.add({
      targets: t, y: -t.height - 20, duration: 26000, delay: 1200, onComplete: () => {
        this.registry.set('started', true);
        this.banner('Het Geheim van Hollowmere', 'Voltooid. Jullie ster staat nu aan de hemel boven de villa.', '#fff4c0');
        this.travel('manor-grounds', { x: 9 * 32, y: 13 * 32, facing: 'down' });
      },
    });
    const skip = () => { this.tweens.killTweensOf(t); t.y = -t.height - 20; this.registry.set('started', true); this.travel('manor-grounds', { x: 9 * 32, y: 13 * 32, facing: 'down' }); };
    this.time.delayedCall(3000, () => this.input.keyboard!.once('keydown-ESC', skip));
  }

  protected tick() {
    if (this.registry.get('started') && this.player && this.player.y > 412) this.travel('manor-grounds', { x: 19.5 * 32, y: 10.6 * 32, facing: 'down' });
  }
}
