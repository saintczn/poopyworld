import Phaser from 'phaser';
import { VIEW_WIDTH as W } from '../../config';
import { PartyGame, type Player } from './PartyGame';

type Berry = { img: Phaser.GameObjects.Sprite; x: number; y: number; speed: number; bounce: number };
type Candy = { img: Phaser.GameObjects.Image; x: number; y: number };

/**
 * Aardbeien Ontsnapping: angry strawberries hunt you down while you grab M&M's.
 * Caught by a strawberry = three M&M's gone and a moment of disgust.
 */
export class StrawberryEscape extends PartyGame {
  protected readonly title = 'Aardbeien Ontsnapping';
  protected readonly intro = 'Pak zoveel mogelijk M&M\'s.\nMaar pas op: de AARDBEIEN komen eraan.\nGeraakt = 3 M&M\'s kwijt (en heel vies).';
  protected readonly gameKey = 'strawberry-escape';
  private berries: Berry[] = [];
  private candies: Candy[] = [];
  private nextBerry = 0;

  constructor() {
    super('strawberry-escape');
  }

  protected drawArena() {
    this.berries = []; this.candies = []; this.nextBerry = 6;
    if (!this.anims.exists('berry-hop')) this.anims.create({ key: 'berry-hop', frames: this.anims.generateFrameNumbers('bali-strawberry', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    const g = this.add.graphics().setDepth(-10);
    // a giant picnic blanket
    for (let y = 0; y < 360; y += 40) for (let x = 0; x < W; x += 40) {
      g.fillStyle(((x + y) / 40) % 2 ? 0xf4ecd8 : 0xe8584a); g.fillRect(x, y, 40, 40);
    }
    g.fillStyle(0x000000, 0.12);
    for (let y = 0; y < 360; y += 40) g.fillRect(0, y + 18, W, 4);
    for (let x = 0; x < W; x += 40) g.fillRect(x + 18, 0, 4, 360);
    g.fillStyle(0x2a1a2a, 0.55); g.fillRect(0, 0, W, 54);
  }

  protected spawns() { return [{ x: 160, y: 140 }, { x: 480, y: 140 }, { x: 160, y: 290 }, { x: 480, y: 290 }]; }

  protected onStart() {
    for (let i = 0; i < 10; i++) this.addCandy();
    this.addBerry(); this.addBerry();
  }

  private addCandy() {
    const x = Phaser.Math.Between(30, W - 30), y = Phaser.Math.Between(80, 330);
    const img = this.add.image(x, y, 'bali-mms', Phaser.Math.Between(0, 5)).setDepth(y - 4).setScale(1.4);
    this.candies.push({ img, x, y });
  }

  private addBerry() {
    const side = Phaser.Math.Between(0, 3);
    const x = side === 0 ? -20 : side === 1 ? W + 20 : Phaser.Math.Between(40, W - 40);
    const y = side === 2 ? 50 : side === 3 ? 380 : Phaser.Math.Between(90, 320);
    const img = this.add.sprite(x, y, 'bali-strawberry', 0).setOrigin(0.5, 0.9).play('berry-hop');
    this.berries.push({ img, x, y, speed: 58 + this.berries.length * 4, bounce: 0 });
  }

  protected step(dt: number) {
    const elapsed = this.roundTime - this.timeLeft;
    this.nextBerry -= dt;
    if (this.nextBerry <= 0 && this.berries.length < 8) { this.nextBerry = 7; this.addBerry(); }
    while (this.candies.length < 10) this.addCandy();

    // candies
    for (const p of this.players) {
      if (p.stunned > 0) continue;
      for (const c of [...this.candies]) {
        if (Math.hypot(c.x - p.x, c.y - (p.y - 8)) < 18) {
          p.score++; c.img.destroy(); this.candies.splice(this.candies.indexOf(c), 1);
          this.pop(c.x, c.y - 10, '+1', '#ffe27a');
          this.updateHud();
        }
      }
    }
    // strawberries chase the nearest player who isn't already sick
    for (const b of this.berries) {
      if (b.bounce > 0) { b.bounce -= dt; }
      const targets = this.players.filter((p) => p.stunned <= 0);
      const t = targets.sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0];
      if (t && b.bounce <= 0) {
        const a = Math.atan2(t.y - b.y, t.x - b.x);
        const sp = b.speed + elapsed * 1.1;
        b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt;
        b.img.setFlipX(Math.cos(a) < 0);
        if (Math.hypot(t.x - b.x, t.y - b.y) < 18) {
          t.stunned = 1.4;
          const lost = Math.min(3, t.score);
          t.score -= lost;
          this.pop(t.x, t.y - 60, t.human ? 'BAH! AARDBEI!' : 'Bah!', '#ff8a8a');
          if (t.human) this.cameras.main.shake(180, 0.008);
          // the berry bounces back, pleased with itself
          b.bounce = 0.9;
          this.tweens.add({ targets: b, x: b.x - Math.cos(a) * 60, y: b.y - Math.sin(a) * 60, duration: 400, ease: 'Quad.easeOut' });
          this.updateHud();
        }
      }
      b.img.setPosition(b.x, b.y).setDepth(b.y);
    }
  }

  protected aiTarget(p: Player) {
    // run if a strawberry is close
    let danger: { x: number; y: number } | null = null, dmin = 85 * (0.6 + p.ai.skill * 0.6);
    for (const b of this.berries) { const d = Math.hypot(b.x - p.x, b.y - p.y); if (d < dmin) { dmin = d; danger = b; } }
    if (danger) {
      const a = Math.atan2(p.y - danger.y, p.x - danger.x);
      return { x: Phaser.Math.Clamp(p.x + Math.cos(a) * 90, 30, W - 30), y: Phaser.Math.Clamp(p.y + Math.sin(a) * 90, 80, 330) };
    }
    // otherwise: the best candy (close, and far from strawberries)
    let best = { x: p.x, y: p.y }, score = Infinity;
    for (const c of this.candies) {
      let s = Math.hypot(c.x - p.x, c.y - p.y);
      for (const b of this.berries) { const d = Math.hypot(b.x - c.x, b.y - c.y); if (d < 70) s += (70 - d) * 3; }
      s += Math.random() * 30;
      if (s < score) { score = s; best = { x: c.x, y: c.y + 8 }; }
    }
    return best;
  }
}
