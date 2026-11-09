import Phaser from 'phaser';
import { VIEW_WIDTH as W } from '../../config';
import { PartyGame, type Player } from './PartyGame';

const CX = 320, CY = 214;
const ROUNDS = 3;

/**
 * Gladde Paniek: four players on a slippery ice floe that slowly melts.
 * Bump each other into the water. Last one standing gets the most points. Three rounds.
 */
export class SlipperyPanic extends PartyGame {
  protected readonly title = 'Gladde Paniek';
  protected readonly intro = 'Het ijs is spiegelglad en smelt langzaam.\nDuw de anderen het water in.\nDrie rondes. Laatste op het ijs = 3 punten.';
  protected readonly gameKey = 'slippery-panic';
  protected readonly roundTime = 120;
  private radius = 150;
  private round = 1;
  private fallen: Player[] = [];
  private ice!: Phaser.GameObjects.Graphics;
  private between = false;
  private roundClock = 0;

  constructor() {
    super('slippery-panic');
  }

  protected drawArena() {
    this.round = 1; this.fallen = []; this.radius = 150; this.between = false; this.roundClock = 0;
    const g = this.add.graphics().setDepth(-20);
    g.fillStyle(0x2a6a9a); g.fillRect(0, 0, W, 360);
    for (let i = 0; i < 70; i++) { g.fillStyle(0x4a8aba); g.fillRect((i * 89) % W, 60 + (i * 47) % 300, 14, 2); }
    // floating chunks of ice
    for (const [x, y, r] of [[60, 110, 18], [580, 300, 22], [560, 90, 14], [90, 320, 16]]) { g.fillStyle(0xe8f4ff); g.fillEllipse(x, y, r * 2, r); }
    g.fillStyle(0x2a1a2a, 0.5); g.fillRect(0, 0, W, 54);
    this.ice = this.add.graphics().setDepth(-10);
    this.drawIce();
  }

  private drawIce() {
    const g = this.ice; g.clear();
    g.fillStyle(0xb8d8f0); g.fillEllipse(CX, CY + 6, this.radius * 2 + 8, this.radius * 1.2 + 10);
    g.fillStyle(0xe8f4ff); g.fillEllipse(CX, CY, this.radius * 2, this.radius * 1.2);
    g.fillStyle(0xffffff, 0.7);
    g.fillEllipse(CX - this.radius * 0.35, CY - this.radius * 0.2, this.radius * 0.5, this.radius * 0.12);
    g.lineStyle(1, 0xa8c8e0);
    g.lineBetween(CX - 30, CY - 20, CX + 10, CY + 15); g.lineBetween(CX + 10, CY + 15, CX + 40, CY + 5);
  }

  protected spawns() {
    const r = 70;
    return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ({ x: CX + a * r, y: CY + b * r * 0.5 }));
  }

  /** Ice: you only push, you never stop quickly. */
  protected move(p: Player, dir: { x: number; y: number }, dt: number) {
    if (p.out) return;
    const accel = 380;
    p.vx += dir.x * accel * dt; p.vy += dir.y * accel * dt;
    const f = Math.exp(-0.9 * dt);
    p.vx *= f; p.vy *= f;
    const sp = Math.hypot(p.vx, p.vy), max = 210;
    if (sp > max) { p.vx = p.vx / sp * max; p.vy = p.vy / sp * max; }
    p.x += p.vx * dt; p.y += p.vy * dt;
  }

  protected clamp() { /* no walls on the ice */ }

  private onIce(p: Player) {
    const dx = (p.x - CX) / this.radius, dy = (p.y - CY) / (this.radius * 0.6);
    return dx * dx + dy * dy <= 1;
  }

  protected step(dt: number) {
    if (this.between) return;
    // the ice melts, faster and faster
    this.roundClock += dt;
    this.radius = Math.max(32, this.radius - dt * (3 + this.roundClock * 0.35));
    this.drawIce();
    // bumping
    const alive = this.players.filter((p) => !p.out);
    for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i], b = alive[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 24) {
        const nx = dx / d, ny = dy / d;
        const push = (24 - d) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel > 0) {
          const k = rel * 1.7 + 30;
          a.vx -= k * nx; a.vy -= k * ny; b.vx += k * nx; b.vy += k * ny;
          if (rel > 90) this.pop((a.x + b.x) / 2, (a.y + b.y) / 2 - 40, 'BONK!', '#ffe27a');
        }
      }
    }
    // falling in
    for (const p of alive) {
      if (!this.onIce(p)) {
        p.out = true;
        this.fallen.push(p);
        this.tweens.add({ targets: [p.sprite, p.label], alpha: 0, y: '+=14', duration: 300 });
        for (let k = 0; k < 14; k++) {
          const d = this.add.image(p.x + Phaser.Math.Between(-12, 12), p.y, 'dot').setTint(0xe8f8ff).setScale(Phaser.Math.FloatBetween(1, 2.4)).setDepth(p.y + 5);
          this.tweens.add({ targets: d, y: p.y - Phaser.Math.Between(8, 30), alpha: 0, duration: 500, onComplete: () => d.destroy() });
        }
        this.pop(p.x, p.y - 40, p.human ? 'PLONS! Koud!' : 'PLONS!', '#9be3ff');
      }
    }
    const left = this.players.filter((p) => !p.out);
    if (left.length <= 1) this.endRound(left[0]);
    else if (this.roundClock > 30) this.endRound(undefined, left);
  }

  private endRound(winner?: Player, survivors: Player[] = []) {
    this.between = true;
    // points: last one standing 3, then 2, 1, 0 for the first one in the water
    const order = [...this.fallen];
    if (winner) order.push(winner);
    order.forEach((p, i) => { p.score += Math.max(0, i - (4 - order.length)); });
    // time up: everyone still dry shares the top
    for (const p of survivors) p.score += 2;
    this.updateHud();
    const msg = winner ? `${winner.name} wint ronde ${this.round}!` : survivors.length ? 'Tijd! Wie droog is krijgt 2 punten.' : `Ronde ${this.round}: iedereen nat!`;
    this.pop(CX, CY - 80, msg, '#ffe27a');
    this.time.delayedCall(1800, () => {
      if (this.round >= ROUNDS) { this.finish(); return; }
      this.round++;
      this.radius = 150; this.fallen = []; this.roundClock = 0;
      const at = this.spawns();
      this.players.forEach((p, i) => {
        p.out = false; p.x = at[i].x; p.y = at[i].y; p.vx = 0; p.vy = 0;
        p.sprite.setAlpha(1); p.label.setAlpha(1);
      });
      this.pop(CX, CY - 80, `Ronde ${this.round}!`, '#fff6e4');
      this.between = false;
    });
  }

  protected scoreText(p: Player) { return `${p.score} pt${p.out ? ' (nat)' : ''}`; }

  protected aiTarget(p: Player) {
    // too close to the edge: back to the middle
    const dx = (p.x - CX) / this.radius, dy = (p.y - CY) / (this.radius * 0.6);
    if (dx * dx + dy * dy > 0.55 * (0.7 + p.ai.skill * 0.4)) return { x: CX, y: CY };
    // otherwise charge: mostly at whoever is closest, sometimes at whoever is nearest the edge
    const others = this.players.filter((o) => o !== p && !o.out);
    const edge = (o: Player) => ((o.x - CX) / this.radius) ** 2 + ((o.y - CY) / (this.radius * 0.6)) ** 2;
    const near = (o: Player) => Math.hypot(o.x - p.x, o.y - p.y);
    const t = Math.random() < 0.6 ? others.sort((a, b) => near(a) - near(b))[0] : others.sort((a, b) => edge(b) - edge(a))[0];
    if (!t) return { x: CX, y: CY };
    // aim a bit behind them (towards the centre) so the bump sends them outwards
    // aim straight through them, so the bump sends them flying
    return { x: t.x + (t.x - p.x) * 0.6, y: t.y + (t.y - p.y) * 0.6 };
  }
}
