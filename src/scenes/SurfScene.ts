import Phaser from 'phaser';
import { TILE as T } from '../config';

const FONT = '"Pixelify Sans", "Courier New", monospace';
const KEY = 'poopyworld.surf.v1';
const GAME_TIME = 45;
const X = 150;          // where the surfer stays on screen
const GRAVITY = 1100;
const JUMP = -430;

type Thing = { img: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; kind: 'rock' | 'jelly' | 'shell' | 'turtle'; hit: boolean; base: number };

/** Surf Bali: ride the wave, jump over rocks and jellyfish, grab shells. */
export class SurfScene extends Phaser.Scene {
  private surfer!: Phaser.GameObjects.Sprite;
  private board!: Phaser.GameObjects.Image;
  private things: Thing[] = [];
  private y = 0; private vy = 0; private onWave = true;
  private speed = 200; private dist = 0; private shells = 0; private hearts = 3;
  private timeLeft = GAME_TIME; private state: 'ready' | 'play' | 'done' = 'ready';
  private nextSpawn = 0; private hurtUntil = 0;
  private hud!: Phaser.GameObjects.Text;
  private waveG!: Phaser.GameObjects.Graphics;
  private far!: Phaser.GameObjects.Graphics;
  private card?: Phaser.GameObjects.Container;
  private turtles = 0;
  private nextDolphin = 3;

  constructor() {
    super('surf');
  }

  create() {
    this.things = []; this.dist = 0; this.shells = 0; this.hearts = 3; this.speed = 200;
    this.timeLeft = GAME_TIME; this.state = 'ready'; this.vy = 0; this.turtles = 0; this.nextDolphin = 3; this.onWave = true; this.nextSpawn = 0;
    const hudEl = document.getElementById('hud');
    if (hudEl) { hudEl.style.visibility = 'hidden'; this.events.once('shutdown', () => { hudEl.style.visibility = ''; }); }

    // sky, sun, island far away
    const sky = this.add.graphics();
    for (let y = 0; y < 200; y += 4) {
      const t = y / 200;
      sky.fillStyle(Phaser.Display.Color.GetColor(110 + 120 * t, 190 + 40 * t, 240 - 20 * t)); sky.fillRect(0, y, 640, 4);
    }
    sky.fillStyle(0xfff2a0); sky.fillCircle(520, 60, 26);
    sky.fillStyle(0xffffff, 0.35); sky.fillCircle(520, 60, 34);
    this.far = this.add.graphics();
    this.waveG = this.add.graphics().setDepth(10);

    // the surfer: your own character on a board
    const look = (this.registry.get('lookKey') as string) ?? 'look0';
    this.board = this.add.image(X, 0, 'bali-surf-board').setDepth(20).setScale(1.2);
    this.surfer = this.add.sprite(X, 0, `${look}-idle`, 9).setOrigin(0.5, 61 / 64).setDepth(21);
    this.y = this.waveY(X, 0);

    this.hud = this.add.text(16, 12, '', { fontFamily: FONT, fontSize: '14px', color: '#ffffff', stroke: '#1a3a48', strokeThickness: 4 })
      .setResolution(2).setDepth(100);

    const kb = this.input.keyboard!;
    kb.on('keydown-SPACE', () => this.press());
    kb.on('keydown-W', () => this.press());
    kb.on('keydown-UP', () => this.press());
    kb.on('keydown-E', () => { if (this.state === 'done') this.leave(); });
    kb.on('keydown-ENTER', () => { if (this.state === 'done') this.leave(); else this.press(); });
    kb.on('keydown-ESC', () => this.leave());
    this.input.on('pointerdown', () => (this.state === 'done' ? this.leave() : this.press()));

    this.showCard('Surf Bali', 'Spring met SPATIE over rotsen en kwallen.\nPak de schelpjes en geef de schildpadden een high five.\nJe hebt 3 levens en 45 seconden.\n\nDruk op SPATIE om te beginnen');
    this.cameras.main.fadeIn(300);
  }

  /** The height of the water at screen x. */
  private waveY(x: number, t: number) {
    return 268 + Math.sin(x / 70 + t * 2.2) * 7 + Math.sin(x / 31 - t * 3.1) * 3;
  }

  private press() {
    if (this.state === 'ready') { this.state = 'play'; this.card?.destroy(); return; }
    if (this.state === 'play' && this.onWave) { this.vy = JUMP; this.onWave = false; }
  }

  private showCard(title: string, body: string) {
    this.card?.destroy();
    const t1 = this.add.text(0, -40, title, { fontFamily: FONT, fontSize: '24px', color: '#ffe27a', stroke: '#2a1a10', strokeThickness: 5 }).setOrigin(0.5).setResolution(2);
    const t2 = this.add.text(0, 14, body, { fontFamily: FONT, fontSize: '12px', color: '#fff6dc', align: 'center', lineSpacing: 4 }).setOrigin(0.5).setResolution(2);
    const w = Math.max(t1.width, t2.width) + 40, h = t2.height + 100;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a10, 0.9); bg.fillRoundedRect(-w / 2, -h / 2 - 10, w, h, 8);
    bg.lineStyle(3, 0xc9a46a); bg.strokeRoundedRect(-w / 2, -h / 2 - 10, w, h, 8);
    this.card = this.add.container(320, 170, [bg, t1, t2]).setDepth(200);
  }

  private spawn() {
    const r = Math.random();
    const x = 680;
    if (r < 0.12) {
      // a sea turtle swims along just under the surface: touch it for a high five
      const img = this.add.sprite(x, 0, 'bali-turtle-side', 0).setDepth(14).setScale(1.2).setFlipX(true);
      img.anims.create({ key: 't', frames: this.anims.generateFrameNumbers('bali-turtle-side', { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
      img.play('t');
      this.things.push({ img, kind: 'turtle', hit: false, base: -4 });
    } else if (r < 0.45) {
      const img = this.add.image(x, 0, 'bali-surf-rock').setOrigin(0.5, 0.85).setDepth(15);
      this.things.push({ img, kind: 'rock', hit: false, base: 0 });
    } else if (r < 0.62) {
      const img = this.add.sprite(x, 0, 'bali-surf-jelly', 0).setDepth(15).setScale(1.3);
      img.anims.create({ key: 'j', frames: this.anims.generateFrameNumbers('bali-surf-jelly', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
      img.play('j');
      this.things.push({ img, kind: 'jelly', hit: false, base: -10 });
    } else {
      // shells come in a little arc: some on the water, some up high
      const high = Math.random() < 0.5;
      for (let i = 0; i < 3; i++) {
        const img = this.add.image(x + i * 26, 0, 'bali-surf-shell').setDepth(15).setScale(1.3);
        this.things.push({ img, kind: 'shell', hit: false, base: high ? -60 - Math.sin((i / 2) * Math.PI) * 30 : -14 });
      }
    }
  }

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const t = time / 1000;
    this.drawSea(t);

    if (this.state === 'play') {
      this.timeLeft -= dt;
      this.speed = 200 + (GAME_TIME - this.timeLeft) * 5;
      this.dist += this.speed * dt;
      this.nextSpawn -= dt;
      if (this.nextSpawn <= 0) { this.spawn(); this.nextSpawn = Phaser.Math.FloatBetween(0.9, 1.6) * (220 / this.speed); }
      if (this.timeLeft <= 0) this.finish();
    }

    this.nextDolphin -= dt;
    if (this.nextDolphin <= 0) { this.nextDolphin = Phaser.Math.FloatBetween(4, 8); this.dolphin(); }

    // the surfer: rides the wave, or flies after a jump
    const surface = this.waveY(X, t);
    if (!this.onWave) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= surface) { this.y = surface; this.vy = 0; this.onWave = true; }
    } else {
      this.y = surface;
    }
    const tilt = this.onWave ? Math.cos(X / 70 + t * 2.2) * 0.12 : Phaser.Math.Clamp(this.vy / 1600, -0.3, 0.3);
    this.board.setPosition(X, this.y + 2).setRotation(tilt);
    this.surfer.setPosition(X, this.y - 2).setRotation(tilt * 0.6);
    this.surfer.setAlpha(time < this.hurtUntil ? (Math.floor(time / 80) % 2 ? 0.3 : 1) : 1);

    // obstacles and shells
    const move = this.state === 'play' ? this.speed * dt : 0;
    for (const th of this.things) {
      th.img.x -= move;
      th.img.y = this.waveY(th.img.x, t) + th.base + (th.kind === 'jelly' ? Math.sin(t * 4 + th.img.x / 40) * 4 : 0);
      if (th.hit || this.state !== 'play') continue;
      const dx = Math.abs(th.img.x - X);
      if (th.kind === 'turtle') {
        if (dx < 26 && this.y > th.img.y - 34) {
          th.hit = true; this.turtles++;
          const t2 = this.add.text(th.img.x, th.img.y - 30, 'High five! +25', { fontFamily: FONT, fontSize: '12px', color: '#c8ff9a', stroke: '#1a3a48', strokeThickness: 4 })
            .setOrigin(0.5).setResolution(2).setDepth(120);
          this.tweens.add({ targets: t2, y: t2.y - 30, alpha: 0, duration: 1200, onComplete: () => t2.destroy() });
        }
        continue;
      }
      if (th.kind === 'shell') {
        if (dx < 18 && Math.abs(th.img.y - (this.y - 26)) < 30) {
          th.hit = true; this.shells++;
          this.tweens.add({ targets: th.img, y: th.img.y - 30, alpha: 0, duration: 300 });
        }
      } else if (dx < 16 && this.y > th.img.y - 18 && time > this.hurtUntil) {
        th.hit = true; this.hearts--; this.hurtUntil = time + 1200;
        this.cameras.main.shake(200, 0.01);
        if (this.hearts <= 0) this.finish();
      }
    }
    this.things = this.things.filter((th) => {
      if (th.img.x < -40) { th.img.destroy(); return false; }
      return true;
    });

    const score = this.score();
    this.hud.setText(`Score ${score}   Schelpjes ${this.shells}   Schildpadden ${this.turtles}   ${'♥'.repeat(Math.max(0, this.hearts))}${'·'.repeat(3 - Math.max(0, this.hearts))}   ${Math.max(0, Math.ceil(this.timeLeft))}s`);
  }

  /** A dolphin leaps out of the far waves. */
  private dolphin() {
    const x0 = Phaser.Math.Between(260, 560), y0 = Phaser.Math.Between(222, 238);
    const d = this.add.image(x0, y0, 'bali-dolphin').setDepth(5).setFlipX(true);
    const state = { t: 0 };
    this.tweens.add({
      targets: state, t: 1, duration: 1300, ease: 'Linear',
      onUpdate: () => {
        const k = state.t;
        d.setPosition(x0 - 90 * k, y0 - Math.sin(k * Math.PI) * 46).setRotation((k - 0.5) * 1.6);
      },
      onComplete: () => d.destroy(),
    });
    for (const at of [0, 1250]) this.time.delayedCall(at, () => {
      for (let i = 0; i < 6; i++) {
        const s = this.add.image(x0 - (at ? 90 : 0) + Phaser.Math.Between(-8, 8), y0, 'dot').setTint(0xe8f8ff).setDepth(6);
        this.tweens.add({ targets: s, y: y0 - Phaser.Math.Between(6, 16), alpha: 0, duration: 400, onComplete: () => s.destroy() });
      }
    });
  }

  private score() {
    return Math.floor(this.dist / 20) + this.shells * 10 + this.turtles * 25;
  }

  private drawSea(t: number) {
    // far waves
    const f = this.far; f.clear();
    f.fillStyle(0x4f9fbf); f.fillRect(0, 200, 640, 160);
    f.fillStyle(0x3f6f4a);
    for (let x = 380; x < 620; x += 4) f.fillRect(x, 198 - Math.sin((x - 380) / 240 * Math.PI) * 18, 4, 4 + Math.sin((x - 380) / 240 * Math.PI) * 18);
    f.fillStyle(0x7fc0d8);
    for (let i = 0; i < 18; i++) {
      const x = ((i * 53 - this.dist * 0.2) % 700 + 700) % 700 - 30;
      f.fillRect(x, 214 + (i % 4) * 10, 18, 2);
    }
    // the wave you ride
    const g = this.waveG; g.clear();
    g.fillStyle(0x2f8fb0);
    for (let x = 0; x <= 640; x += 4) { const y = this.waveY(x, t); g.fillRect(x, y, 4, 360 - y); }
    g.fillStyle(0x1f6f90);
    for (let x = 0; x <= 640; x += 4) { const y = this.waveY(x, t) + 24; g.fillRect(x, y, 4, 360 - y); }
    g.fillStyle(0xffffff, 0.9);
    for (let x = 0; x <= 640; x += 4) { const y = this.waveY(x, t); if (((x + Math.floor(this.dist)) / 4) % 5 < 3) g.fillRect(x, y - 1, 4, 3); }
  }

  private finish() {
    if (this.state === 'done') return;
    this.state = 'done';
    const score = this.score();
    let best = 0;
    try { best = Number(JSON.parse(localStorage.getItem(KEY) ?? '{}').best ?? 0); } catch { /* fine */ }
    const record = score > best;
    try { localStorage.setItem(KEY, JSON.stringify({ best: Math.max(best, score) })); } catch { /* fine */ }
    const verdict = this.hearts <= 0 ? 'Wipe-out!' : score > 300 ? 'Echte Bali-surfer!' : 'Lekker gesurft!';
    this.showCard(verdict, `Score: ${score}   (${this.shells} schelpjes, ${this.turtles} schildpad-high-fives)\n${record ? 'Nieuw record!' : `Record: ${best}`}\n\nE of klik: terug naar het strand`);
  }

  private leave() {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('bali', { arrive: { x: 20.6 * T, y: 20.4 * T, facing: 'down' } }));
  }
}
