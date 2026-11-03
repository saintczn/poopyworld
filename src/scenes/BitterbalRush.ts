import Phaser from 'phaser';
import { VIEW_WIDTH as W, VIEW_HEIGHT as H } from '../config';
import { OPPONENTS, loadPuck, savePuck } from '../content/puck';
import { randomLook, type Look } from '../characters/look';
import { rng } from '../world/ground';

/**
 * PUCK mini-game "Bitterbal Rush": four players catch falling bitterballen for 45 seconds.
 * Gold bitterbal = 3 points, mustard = stunned for a moment. A reaction game, no memory needed.
 */
const ROUND = 45;
const GROUND = 304;
const FONT = '"Pixelify Sans", "Courier New", monospace';

type Racer = {
  name: string; sprite: Phaser.GameObjects.Sprite; look: string; score: number; speed: number;
  stunned: number; human: boolean; dir: 'left' | 'right' | 'down';
  ai?: { think: number; greed: number; careful: number; next: number; targetX: number };
  label: Phaser.GameObjects.Text; stars: Phaser.GameObjects.Image;
};
type Drop = { img: Phaser.GameObjects.Image; kind: 'ball' | 'gold' | 'mustard'; vy: number };

export class BitterbalRush extends Phaser.Scene {
  private racers: Racer[] = [];
  private drops: Drop[] = [];
  private keys!: Record<'A' | 'D' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;
  private state: 'intro' | 'count' | 'play' | 'done' = 'intro';
  private timeLeft = ROUND;
  private nextDrop = 0;
  private hud!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private bannerBg!: Phaser.GameObjects.Graphics;

  constructor() {
    super('bitterbal-rush');
  }

  create() {
    this.racers = [];
    this.drops = [];
    this.state = 'intro';
    this.timeLeft = ROUND;
    this.cameras.main.fadeIn(250, 20, 10, 24);
    this.drawArena();
    // the world HUD (top bar) is hidden while playing
    const hud = document.getElementById('hud');
    if (hud) hud.hidden = true;
    this.events.once('shutdown', () => { if (hud) hud.hidden = false; });

    const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
    const me = this.registry.get('lookKey') as string;
    const r = rng(99);
    const looks = OPPONENTS.map(() => randomLook(r));
    Promise.all(looks.map((l) => install(l))).then((keys) => {
      if (!this.sys.isActive()) return;
      const profileName = (document.getElementById('hud-name')?.textContent || 'Jij').trim() || 'Jij';
      const lanes = [W * 0.2, W * 0.4, W * 0.6, W * 0.8];
      this.addRacer(profileName, me, lanes[0], 165, true);
      OPPONENTS.forEach((o, i) => this.addRacer(o.name, keys[i], lanes[i + 1], o.speed, false, o));
      this.updateHud();
    });

    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT') as typeof this.keys;
    const go = () => this.pressGo();
    this.input.keyboard!.on('keydown-E', go);
    this.input.keyboard!.on('keydown-SPACE', go);
    this.input.keyboard!.on('keydown-ENTER', go);
    this.input.keyboard!.on('keydown-ESC', () => { if (this.state !== 'play') this.leave(); });

    this.hud = this.add.text(12, 10, '', { fontFamily: FONT, fontSize: '13px', color: '#fff6e4', stroke: '#2a1a2a', strokeThickness: 4, lineSpacing: 2 }).setResolution(2).setDepth(100);
    this.timerText = this.add.text(W - 12, 10, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe27a', stroke: '#2a1a2a', strokeThickness: 4 }).setOrigin(1, 0).setResolution(2).setDepth(100);
    this.banner = this.add.text(W / 2, 120, '', { fontFamily: FONT, fontSize: '16px', color: '#fff6e4', stroke: '#2a1a2a', strokeThickness: 5, align: 'center', lineSpacing: 6 })
      .setOrigin(0.5).setResolution(2).setDepth(100);
    this.bannerBg = this.add.graphics().setDepth(99);
        this.banner.setText('BITTERBAL RUSH\n\nVang zoveel mogelijk bitterballen.\nGoud = 3 punten. Mosterd = even duizelig!\n\nLopen: A/D of pijltjes\nDruk op E om te beginnen');
    this.fitBanner();
  }

  /** Redraws the dark card behind the centre text (or hides it when empty). */
  private fitBanner() {
    const g = this.bannerBg;
    g.clear();
    if (!this.banner.text) return;
    const b = this.banner.getBounds();
    g.fillStyle(0x140c18, 0.82); g.fillRoundedRect(b.x - 18, b.y - 12, b.width + 36, b.height + 24, 8);
    g.lineStyle(3, 0xff7ae0, 1); g.strokeRoundedRect(b.x - 18, b.y - 12, b.width + 36, b.height + 24, 8);
  }

  private drawArena() {
    const g = this.add.graphics().setDepth(-10);
    // back wall with stripes, floor and a stage edge
    g.fillStyle(0x2a1a3a); g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 32) { g.fillStyle(x % 64 ? 0x34204a : 0x3c2656); g.fillRect(x, 0, 32, GROUND - 30); }
    g.fillStyle(0x5a3a2a); g.fillRect(0, GROUND - 30, W, H - GROUND + 30);
    for (let x = 0; x < W; x += 32) { g.fillStyle(0x6a4632); g.fillRect(x, GROUND - 30, 30, H); }
    g.fillStyle(0xff7ae0); g.fillRect(0, GROUND - 32, W, 3);
    // string lights
    for (let x = 8; x < W; x += 24) {
      const col = [0xff7ae0, 0xffe27a, 0x9be3ff, 0x8ce07a][(x / 24) % 4 | 0];
      g.fillStyle(col); g.fillCircle(x, 22 + Math.sin(x / 40) * 6, 3);
    }
    this.add.text(W / 2, 52, 'PUCK', { fontFamily: FONT, fontSize: '34px', color: '#ff7ae0', stroke: '#5a1a5a', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0.35).setResolution(2).setDepth(-5);
  }

  private addRacer(name: string, look: string, x: number, speed: number, human: boolean, o?: (typeof OPPONENTS)[number]) {
    const sprite = this.add.sprite(x, GROUND, `${look}-idle`, 6).setOrigin(0.5, 61 / 64).setDepth(10).play(`${look}-idle-down`);
    const label = this.add.text(x, GROUND + 6, name, { fontFamily: FONT, fontSize: '11px', color: human ? '#ffe27a' : '#fff6e4', stroke: '#2a1a2a', strokeThickness: 3 }).setOrigin(0.5, 0).setResolution(2).setDepth(11);
    const stars = this.add.image(x, GROUND - 56, 'stars').setDepth(12).setVisible(false);
    this.racers.push({
      name, sprite, look, score: 0, speed, stunned: 0, human, dir: 'down', label, stars,
      ai: o ? { think: o.think, greed: o.greed, careful: o.careful, next: 0, targetX: x } : undefined,
    });
  }

  private pressGo() {
    if (this.state === 'intro' && this.racers.length === 4) {
      this.state = 'count';
      let n = 3;
      this.banner.setText(String(n)).setFontSize(48);
      this.fitBanner();
      this.time.addEvent({
        delay: 700, repeat: 3, callback: () => {
          n--;
          if (n > 0) this.banner.setText(String(n));
          else if (n === 0) this.banner.setText('GO!');
          else { this.banner.setText(''); this.state = 'play'; }
          this.fitBanner();
        },
      });
    } else if (this.state === 'done') {
      this.leave();
    }
  }

  private leave() {
    this.cameras.main.fadeOut(250, 20, 10, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('puck', { arrive: { x: 96, y: 180, facing: 'up' } }));
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this.state !== 'play') {
      for (const r of this.racers) this.walk(r, 0);
      return;
    }
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.finish(); return; }

    // spawn: faster and more of them as time runs out
    this.nextDrop -= dt;
    const progress = 1 - this.timeLeft / ROUND;
    if (this.nextDrop <= 0) {
      this.nextDrop = Phaser.Math.FloatBetween(0.32, 0.6) * (1 - progress * 0.45);
      const roll = Math.random();
      const kind: Drop['kind'] = roll < 0.08 ? 'gold' : roll < 0.08 + 0.15 + progress * 0.08 ? 'mustard' : 'ball';
      const img = this.add.image(Phaser.Math.Between(24, W - 24), -10, kind === 'ball' ? 'bitterbal' : kind === 'gold' ? 'bitterbal-gold' : 'mustard').setDepth(20);
      this.drops.push({ img, kind, vy: Phaser.Math.Between(90, 130) + progress * 80 });
    }

    // move drops, check catches
    for (const d of [...this.drops]) {
      d.img.y += d.vy * dt;
      d.img.rotation += dt * (d.kind === 'mustard' ? 2 : 4);
      const hit = this.racers.find((r) => r.stunned <= 0 && Math.abs(r.sprite.x - d.img.x) < 18 && d.img.y > GROUND - 50 && d.img.y < GROUND - 10);
      if (hit) { this.collect(hit, d); continue; }
      if (d.img.y > GROUND + 6) { d.img.destroy(); this.drops.splice(this.drops.indexOf(d), 1); }
    }

    // move racers
    for (const r of this.racers) {
      if (r.stunned > 0) {
        r.stunned -= dt;
        r.stars.setVisible(true).setPosition(r.sprite.x, GROUND - 58 + Math.sin(this.time.now / 90) * 2);
        r.sprite.setTint(0xffe27a);
        this.walk(r, 0);
        if (r.stunned <= 0) { r.sprite.clearTint(); r.stars.setVisible(false); }
        continue;
      }
      let move = 0;
      if (r.human) {
        move = (this.keys.LEFT.isDown || this.keys.A.isDown ? -1 : 0) + (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0);
      } else if (r.ai) {
        r.ai.next -= dt * 1000;
        if (r.ai.next <= 0) { r.ai.next = r.ai.think + Math.random() * 150; r.ai.targetX = this.chooseTarget(r); }
        const diff = r.ai.targetX - r.sprite.x;
        move = Math.abs(diff) < 6 ? 0 : Math.sign(diff);
      }
      r.sprite.x = Phaser.Math.Clamp(r.sprite.x + move * r.speed * dt, 16, W - 16);
      this.walk(r, move);
    }
    this.timerText.setText(String(Math.ceil(this.timeLeft)));
  }

  /** Where an opponent wants to stand: the best reachable treat, staying away from mustard. */
  private chooseTarget(r: Racer) {
    const ai = r.ai!;
    let best = r.sprite.x, bestScore = -Infinity;
    for (const d of this.drops) {
      const tFall = (GROUND - 30 - d.img.y) / d.vy;
      if (tFall < 0) continue;
      const dist = Math.abs(d.img.x - r.sprite.x);
      const reach = dist / r.speed;
      if (d.kind === 'mustard') continue;
      if (reach > tFall + 0.15) continue;
      const value = (d.kind === 'gold' ? 3 : 1) * ai.greed;
      const score = value - tFall * 0.4 - dist / 400 + Math.random() * 0.3;
      if (score > bestScore) { bestScore = score; best = d.img.x; }
    }
    // step aside if mustard is about to land on the chosen spot
    for (const d of this.drops) {
      if (d.kind !== 'mustard' || Math.random() > ai.careful) continue;
      const tFall = (GROUND - 30 - d.img.y) / d.vy;
      if (tFall > 0 && tFall < 1.2 && Math.abs(d.img.x - best) < 22) best += best < d.img.x ? -34 : 34;
    }
    return Phaser.Math.Clamp(best, 16, W - 16);
  }

  private walk(r: Racer, move: number) {
    const dir = move < 0 ? 'left' : move > 0 ? 'right' : 'down';
    const anim = move === 0 ? `${r.look}-idle-down` : `${r.look}-walk-${dir}`;
    r.sprite.play(anim, true);
    r.label.setX(r.sprite.x);
  }

  private collect(r: Racer, d: Drop) {
    d.img.destroy();
    this.drops.splice(this.drops.indexOf(d), 1);
    if (d.kind === 'mustard') {
      r.stunned = 1.3;
      this.pop(r.sprite.x, GROUND - 64, 'MOSTERD!', '#ffd23a');
    } else {
      const pts = d.kind === 'gold' ? 3 : 1;
      r.score += pts;
      this.pop(r.sprite.x, GROUND - 64, `+${pts}`, d.kind === 'gold' ? '#ffe27a' : '#fff6e4');
    }
    this.updateHud();
  }

  private pop(x: number, y: number, text: string, colour: string) {
    const t = this.add.text(x, y, text, { fontFamily: FONT, fontSize: '13px', color: colour, stroke: '#2a1a2a', strokeThickness: 3 }).setOrigin(0.5).setResolution(2).setDepth(50);
    this.tweens.add({ targets: t, y: y - 20, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  private updateHud() {
    this.hud.setText(this.racers.map((r) => `${r.human ? '> ' : '  '}${r.name}: ${r.score}`).join('\n'));
  }

  private finish() {
    this.state = 'done';
    for (const d of this.drops) d.img.destroy();
    this.drops = [];
    this.timerText.setText('0');
    const ranked = [...this.racers].sort((a, b) => b.score - a.score);
    const me = this.racers.find((r) => r.human)!;
    const place = ranked.indexOf(me) + 1;
    const tickets = [10, 6, 4, 2][place - 1] + Math.floor(me.score / 5);
    const save = loadPuck();
    const prevBest = save.best['bitterbal-rush'] ?? 0;
    save.tickets += tickets;
    save.plays += 1;
    save.best['bitterbal-rush'] = Math.max(prevBest, me.score);
    savePuck(save);
    const medals = ['1e', '2e', '3e', '4e'];
    const lines = ranked.map((r, i) => `${medals[i]}  ${r.name}  ${r.score}`).join('\n');
    const headline = place === 1 ? 'JIJ WINT!' : place === 2 ? 'Net niet! Tweede plek.' : 'Volgende keer beter!';
    const record = me.score > prevBest ? `\nNieuw record: ${me.score}!` : '';
    this.banner.setFontSize(13).setLineSpacing(0).setY(168).setText(`${headline}\n\n${lines}\n\n+${tickets} tickets (totaal ${save.tickets})${record}\nDruk op E om terug te gaan`);
    this.fitBanner();
    ranked[0].sprite.play(`${ranked[0].look}-idle-down`);
    this.tweens.add({ targets: ranked[0].sprite, y: GROUND - 10, yoyo: true, repeat: 5, duration: 180 });
  }
}
