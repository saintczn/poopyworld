import Phaser from 'phaser';
import { VIEW_WIDTH as W } from '../../config';
import { PartyGame, type Player } from './PartyGame';

type Goat = { img: Phaser.GameObjects.Sprite; coat: string; x: number; y: number; vx: number; vy: number; wander: number; pen: number };
type Pen = { x: number; y: number; w: number; h: number; cx: number; cy: number };

/**
 * Geitenchaos: goats run away from you. Herd as many as you can into your own pen.
 * Whoever has the most goats in their pen when time is up, wins. Steal them back if you dare.
 */
export class GoatMayhem extends PartyGame {
  protected readonly title = 'Geitenchaos';
  protected readonly intro = 'Geiten rennen weg van je.\nDrijf ze je eigen hok in (jouw kleur).\nDe meeste geiten in je hok aan het eind wint.';
  protected readonly gameKey = 'goat-mayhem';
  protected readonly roundTime = 60;
  private goats: Goat[] = [];
  private pens: Pen[] = [];

  constructor() {
    super('goat-mayhem');
  }

  protected drawArena() {
    this.goats = [];
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0x6aa84a); g.fillRect(0, 0, W, 360);
    for (let i = 0; i < 500; i++) { g.fillStyle(i % 2 ? 0x5a9a3a : 0x7ab85a); g.fillRect((i * 97) % W, (i * 53) % 360, 3, 2); }
    g.fillStyle(0x2a1a2a, 0.5); g.fillRect(0, 0, W, 54);
    // four pens, one in each corner, in the players' colours
    this.pens = [
      { x: 8, y: 60, w: 120, h: 92 }, { x: W - 128, y: 60, w: 120, h: 92 },
      { x: 8, y: 262, w: 120, h: 92 }, { x: W - 128, y: 262, w: 120, h: 92 },
    ].map((p) => ({ ...p, cx: p.x + p.w / 2, cy: p.y + p.h / 2 }));
    this.pens.forEach((p, i) => {
      const top = i < 2;
      g.fillStyle(this.colours[i], 0.35); g.fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle(0x8a6440);
      // fence on the outer sides, open towards the middle of the field
      const fy = top ? p.y : p.y + p.h - 4;
      g.fillRect(p.x, fy, p.w, 4);
      const fx = i % 2 === 0 ? p.x : p.x + p.w - 4;
      g.fillRect(fx, p.y, 4, p.h);
      for (let x = p.x; x < p.x + p.w; x += 14) g.fillRect(x, fy - 4, 4, 12);
      for (let y = p.y; y < p.y + p.h; y += 14) g.fillRect(fx - 4, y, 12, 4);
    });
  }

  protected spawns() { return this.pens.map((p, i) => ({ x: p.cx + (i % 2 ? -70 : 70), y: p.cy + (i < 2 ? 50 : -50) })); }

  protected onStart() {
    const coats = ['white', 'brown', 'black'];
    for (let i = 0; i < 9; i++) {
      const x = Phaser.Math.Between(200, W - 200), y = Phaser.Math.Between(130, 290);
      const coat = coats[i % 3];
      const img = this.add.sprite(x, y, `goat-${coat}`, 8).setOrigin(0.5, 92 / 128).setScale(0.62);
      this.goats.push({ img, coat, x, y, vx: 0, vy: 0, wander: 0, pen: -1 });
    }
  }

  private penOf(x: number, y: number) {
    return this.pens.findIndex((p) => x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h);
  }

  protected step(dt: number) {
    for (const g of this.goats) {
      // flee from nearby players
      let fx = 0, fy = 0;
      for (const p of this.players) {
        const dx = g.x - p.x, dy = g.y - (p.y - 6), d = Math.hypot(dx, dy);
        if (d < 62) { fx += (dx / (d || 1)) * (62 - d); fy += (dy / (d || 1)) * (62 - d); }
      }
      const scared = Math.hypot(fx, fy) > 1;
      if (scared) {
        const l = Math.hypot(fx, fy);
        g.vx = fx / l * 120; g.vy = fy / l * 120;
      } else {
        g.wander -= dt;
        if (g.wander <= 0) {
          g.wander = Phaser.Math.FloatBetween(1, 3);
          const a = Math.random() * Math.PI * 2, sp = Math.random() < 0.4 ? 0 : 22;
          g.vx = Math.cos(a) * sp; g.vy = Math.sin(a) * sp;
        }
      }
      g.x = Phaser.Math.Clamp(g.x + g.vx * dt, 14, W - 14);
      g.y = Phaser.Math.Clamp(g.y + g.vy * dt, 66, 350);
      // calm goats stay inside their pen
      const pen = this.penOf(g.x, g.y);
      if (pen >= 0 && !scared) {
        const p = this.pens[pen];
        g.x = Phaser.Math.Clamp(g.x, p.x + 10, p.x + p.w - 10); g.y = Phaser.Math.Clamp(g.y, p.y + 14, p.y + p.h - 6);
      }
      if (pen !== g.pen) {
        if (pen >= 0) this.pop(g.x, g.y - 30, 'mèèèh!', Phaser.Display.Color.IntegerToColor(this.colours[pen]).rgba);
        g.pen = pen;
      }
      const moving = Math.hypot(g.vx, g.vy) > 5;
      const dir = Math.abs(g.vx) > Math.abs(g.vy) ? (g.vx < 0 ? 'left' : 'right') : g.vy < 0 ? 'up' : 'down';
      g.img.play(`goat-${g.coat}-${moving ? 'walk' : 'idle'}-${dir}`, true);
      g.img.setPosition(g.x, g.y).setDepth(g.y);
    }
    this.players.forEach((p, i) => { p.score = this.goats.filter((g) => g.pen === i).length; });
    this.updateHud();
  }

  protected scoreText(p: Player) { return `${p.score} ${p.score === 1 ? 'geit' : 'geiten'}`; }

  protected aiTarget(p: Player) {
    const i = this.players.indexOf(p);
    const pen = this.pens[i];
    // pick a goat that is not in my pen (stealing is allowed), nearest first
    const free = this.goats.filter((g) => g.pen !== i)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const g = free[Math.random() < p.ai.skill ? 0 : Math.min(1, free.length - 1)];
    if (!g) return { x: pen.cx + (i % 2 ? -90 : 90), y: pen.cy };
    // stand behind the goat, on the far side from my pen, so it runs towards the pen
    const dx = g.x - pen.cx, dy = g.y - pen.cy, l = Math.hypot(dx, dy) || 1;
    return { x: g.x + dx / l * 34, y: g.y + dy / l * 34 + 6 };
  }
}
