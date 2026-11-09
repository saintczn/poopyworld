import Phaser from 'phaser';
import { VIEW_WIDTH as W } from '../../config';
import { OPPONENTS, loadPuck, savePuck } from '../../content/puck';
import { randomLook, type Look } from '../../characters/look';
import { rng } from '../../world/ground';

export const FONT = '"Pixelify Sans", "Courier New", monospace';

export type Player = {
  name: string; look: string; sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text;
  x: number; y: number; vx: number; vy: number; speed: number; human: boolean;
  score: number; stunned: number; out: boolean; colour: number; facing: 'up' | 'down' | 'left' | 'right';
  ai: { think: number; next: number; tx: number; ty: number; skill: number };
};

/**
 * Base for the top-down PUCK party games: four players (you plus three regulars),
 * an intro card, a countdown, a timer, results and tickets.
 */
export abstract class PartyGame extends Phaser.Scene {
  protected players: Player[] = [];
  protected state: 'intro' | 'count' | 'play' | 'done' = 'intro';
  protected timeLeft = 45;
  protected abstract readonly title: string;
  protected abstract readonly intro: string;
  protected abstract readonly gameKey: string;
  protected readonly roundTime: number = 45;
  protected readonly colours = [0xffe27a, 0x7ad0ff, 0xff8a8a, 0x9be07a];
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;
  private hudText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private card!: Phaser.GameObjects.Text;
  private cardBg!: Phaser.GameObjects.Graphics;

  /** Draw the arena. */
  protected abstract drawArena(): void;
  /** Where the four players start. */
  protected abstract spawns(): Array<{ x: number; y: number }>;
  /** Called every frame while playing. */
  protected abstract step(dt: number): void;
  /** Where an AI player wants to go (a world position). */
  protected abstract aiTarget(p: Player): { x: number; y: number };
  /** Optional: called once when the countdown ends. */
  protected onStart(): void {}
  /** The score line for the HUD (default: points). */
  protected scoreText(p: Player) { return `${p.score}`; }
  /** Keeps a player inside the playing field. */
  protected clamp(p: Player) { p.x = Phaser.Math.Clamp(p.x, 20, W - 20); p.y = Phaser.Math.Clamp(p.y, 70, 340); }

  create() {
    this.players = [];
    this.state = 'intro';
    this.timeLeft = this.roundTime;
    this.cameras.main.fadeIn(250, 20, 10, 24);
    const hud = document.getElementById('hud');
    if (hud) hud.hidden = true;
    this.events.once('shutdown', () => { if (hud) hud.hidden = false; });
    this.drawArena();

    this.hudText = this.add.text(10, 8, '', { fontFamily: FONT, fontSize: '12px', color: '#fff6e4', stroke: '#2a1a2a', strokeThickness: 4, lineSpacing: 1 }).setResolution(2).setDepth(5000);
    this.timerText = this.add.text(W - 12, 8, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe27a', stroke: '#2a1a2a', strokeThickness: 4 }).setOrigin(1, 0).setResolution(2).setDepth(5000);
    this.cardBg = this.add.graphics().setDepth(5001);
    this.card = this.add.text(W / 2, 170, '', { fontFamily: FONT, fontSize: '14px', color: '#fff6e4', stroke: '#2a1a2a', strokeThickness: 4, align: 'center', lineSpacing: 5 })
      .setOrigin(0.5).setResolution(2).setDepth(5002);
    this.showCard(`${this.title.toUpperCase()}\n\n${this.intro}\n\nLopen: WASD of pijltjes\nDruk op E om te beginnen`);

    const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
    const me = (this.registry.get('lookKey') as string) ?? 'look0';
    const r = rng(99);
    const looks = OPPONENTS.map(() => randomLook(r));
    Promise.all(looks.map((l) => install(l))).then((keys) => {
      if (!this.sys.isActive()) return;
      const name = (document.getElementById('hud-name')?.textContent || 'Jij').trim() || 'Jij';
      const at = this.spawns();
      this.addPlayer(name, me, at[0], 150, true, 0);
      OPPONENTS.forEach((o, i) => this.addPlayer(o.name, keys[i], at[i + 1], o.speed * 0.95, false, i + 1, o.think, o.careful));
      this.updateHud();
    });

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
    const go = () => this.pressGo();
    this.input.keyboard!.on('keydown-E', go);
    this.input.keyboard!.on('keydown-SPACE', go);
    this.input.keyboard!.on('keydown-ENTER', go);
    this.input.keyboard!.on('keydown-ESC', () => { if (this.state !== 'play') this.leave(); });
  }

  private addPlayer(name: string, look: string, at: { x: number; y: number }, speed: number, human: boolean, i: number, think = 250, skill = 0.7) {
    const sprite = this.add.sprite(at.x, at.y, `${look}-idle`, 6).setOrigin(0.5, 61 / 64).play(`${look}-idle-down`);
    const label = this.add.text(at.x, at.y + 4, name, { fontFamily: FONT, fontSize: '10px', color: Phaser.Display.Color.IntegerToColor(this.colours[i]).rgba, stroke: '#2a1a2a', strokeThickness: 3 })
      .setOrigin(0.5, 0).setResolution(2);
    this.players.push({
      name, look, sprite, label, x: at.x, y: at.y, vx: 0, vy: 0, speed, human, score: 0, stunned: 0, out: false,
      colour: this.colours[i], facing: 'down', ai: { think, next: 0, tx: at.x, ty: at.y, skill },
    });
  }

  protected showCard(text: string) {
    this.card.setText(text);
    const g = this.cardBg; g.clear();
    if (!text) return;
    const b = this.card.getBounds();
    g.fillStyle(0x140c18, 0.86); g.fillRoundedRect(b.x - 18, b.y - 12, b.width + 36, b.height + 24, 8);
    g.lineStyle(3, 0xff7ae0, 1); g.strokeRoundedRect(b.x - 18, b.y - 12, b.width + 36, b.height + 24, 8);
  }

  private pressGo() {
    if (this.state === 'intro' && this.players.length === 4) {
      this.state = 'count';
      let n = 3;
      this.card.setFontSize(40); this.showCard('3');
      this.time.addEvent({
        delay: 650, repeat: 3, callback: () => {
          n--;
          if (n > 0) this.showCard(String(n));
          else if (n === 0) this.showCard('GO!');
          else { this.card.setFontSize(14); this.showCard(''); this.state = 'play'; this.onStart(); }
        },
      });
    } else if (this.state === 'done') {
      this.leave();
    }
  }

  protected leave() {
    this.cameras.main.fadeOut(250, 20, 10, 24);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('puck', { arrive: { x: 256, y: 190, facing: 'up' } }));
  }

  /** The direction a player wants to move this frame (length 0..1). */
  protected wish(p: Player, dt: number) {
    if (p.human) {
      const k = this.keys;
      const x = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0);
      const y = (k.UP.isDown || k.W.isDown ? -1 : 0) + (k.DOWN.isDown || k.S.isDown ? 1 : 0);
      const l = Math.hypot(x, y) || 1;
      return { x: x / l, y: y / l };
    }
    p.ai.next -= dt * 1000;
    if (p.ai.next <= 0) {
      p.ai.next = p.ai.think + Math.random() * 120;
      const t = this.aiTarget(p);
      p.ai.tx = t.x; p.ai.ty = t.y;
    }
    const dx = p.ai.tx - p.x, dy = p.ai.ty - p.y, l = Math.hypot(dx, dy);
    return l < 6 ? { x: 0, y: 0 } : { x: dx / l, y: dy / l };
  }

  /** Plain walking (override for ice). */
  protected move(p: Player, dir: { x: number; y: number }, dt: number) {
    p.vx = dir.x * p.speed; p.vy = dir.y * p.speed;
    p.x += p.vx * dt; p.y += p.vy * dt;
    this.clamp(p);
  }

  protected animate(p: Player, dir: { x: number; y: number }) {
    if (Math.abs(dir.x) + Math.abs(dir.y) > 0.1) {
      p.facing = Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x < 0 ? 'left' : 'right') : dir.y < 0 ? 'up' : 'down';
      p.sprite.play(`${p.look}-walk-${p.facing}`, true);
    } else {
      p.sprite.play(`${p.look}-idle-${p.facing}`, true);
    }
    p.sprite.setPosition(p.x, p.y).setDepth(p.y);
    p.label.setPosition(p.x, p.y + 4).setDepth(p.y + 1);
  }

  protected pop(x: number, y: number, text: string, colour = '#fff6e4') {
    const t = this.add.text(x, y, text, { fontFamily: FONT, fontSize: '12px', color: colour, stroke: '#2a1a2a', strokeThickness: 3 }).setOrigin(0.5).setResolution(2).setDepth(4000);
    this.tweens.add({ targets: t, y: y - 20, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  protected updateHud() {
    this.hudText.setText(this.players.map((p) => `${p.human ? '> ' : '  '}${p.name}: ${this.scoreText(p)}`).join('\n'));
  }

  update(_t: number, ms: number) {
    const dt = Math.min(0.05, ms / 1000);
    if (this.state !== 'play') {
      for (const p of this.players) this.animate(p, { x: 0, y: 0 });
      return;
    }
    this.timeLeft -= dt;
    this.timerText.setText(String(Math.max(0, Math.ceil(this.timeLeft))));
    for (const p of this.players) {
      if (p.out) continue;
      if (p.stunned > 0) {
        p.stunned -= dt;
        p.sprite.setTint(0xff9a9a);
        if (p.stunned <= 0) p.sprite.clearTint();
        this.move(p, { x: 0, y: 0 }, dt);
        this.animate(p, { x: 0, y: 0 });
        continue;
      }
      const dir = this.wish(p, dt);
      this.move(p, dir, dt);
      this.animate(p, dir);
    }
    this.step(dt);
    if (this.timeLeft <= 0 && this.state === 'play') this.finish();
  }

  /** Ends the game: ranking, tickets, best score. */
  protected finish(extra = '') {
    if (this.state === 'done') return;
    this.state = 'done';
    const ranked = [...this.players].sort((a, b) => b.score - a.score);
    const me = this.players.find((p) => p.human)!;
    const place = ranked.indexOf(me) + 1;
    const tickets = [10, 6, 4, 2][place - 1] + Math.max(0, Math.floor(me.score / 3));
    const save = loadPuck();
    const prev = save.best[this.gameKey] ?? 0;
    save.tickets += tickets; save.plays += 1; save.best[this.gameKey] = Math.max(prev, me.score);
    savePuck(save);
    const lines = ranked.map((p, i) => `${i + 1}e  ${p.name}  ${this.scoreText(p)}`).join('\n');
    const head = place === 1 ? 'JIJ WINT!' : place === 2 ? 'Net niet! Tweede plek.' : 'Volgende keer beter!';
    const record = me.score > prev ? `\nNieuw record: ${me.score}!` : '';
    this.card.setFontSize(13);
    this.showCard(`${head}${extra ? `\n${extra}` : ''}\n\n${lines}\n\n+${tickets} tickets (totaal ${save.tickets})${record}\nDruk op E om terug te gaan`);
    const win = ranked[0];
    this.tweens.add({ targets: win.sprite, y: win.y - 10, yoyo: true, repeat: 5, duration: 180 });
  }
}
