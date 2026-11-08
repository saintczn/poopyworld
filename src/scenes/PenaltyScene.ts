import Phaser from 'phaser';
import { TILE as T } from '../config';
import { YARA_LOOK } from '../content/family';
import { loadBrasil, saveBrasil, YARA, goal } from '../content/brasil';
import type { Look } from '../characters/look';

const FONT = '"Pixelify Sans", "Courier New", monospace';
const ROUNDS = 5;
type Zone = 0 | 1 | 2; // left, middle, right

/**
 * Pênaltis on the beach against Yara. You shoot five, she shoots five.
 * Shooting: stop the moving arrow to aim, then stop the power bar (too hard = over the bar).
 * Keeping: when Yara runs up, press A, W or D to dive left, stay or dive right.
 */
export class PenaltyScene extends Phaser.Scene {
  private state: 'intro' | 'aim' | 'power' | 'flying' | 'keep' | 'keepwait' | 'done' = 'intro';
  private round = 0;
  private mine: boolean[] = [];
  private hers: boolean[] = [];
  private aimX = 0; private aimDir = 1; private power = 0; private powerDir = 1;
  private keeper!: Phaser.GameObjects.Sprite;
  private ball!: Phaser.GameObjects.Image;
  private arrow!: Phaser.GameObjects.Triangle;
  private bar!: Phaser.GameObjects.Graphics;
  private info!: Phaser.GameObjects.Text;
  private score!: Phaser.GameObjects.Text;
  private bubble!: Phaser.GameObjects.Text;
  private youKey = 'look0';
  private yaraKey = '';
  private dive: Zone | null = null;

  constructor() {
    super('penalty');
  }

  create() {
    this.state = 'intro'; this.round = 0; this.mine = []; this.hers = []; this.dive = null; this.dots = undefined;
    const hud = document.getElementById('hud');
    if (hud) { hud.style.visibility = 'hidden'; this.events.once('shutdown', () => { hud.style.visibility = ''; }); }
    this.youKey = (this.registry.get('lookKey') as string) ?? 'look0';

    // sky, sea, sand
    const g = this.add.graphics();
    for (let y = 0; y < 110; y += 4) { const t = y / 110; g.fillStyle(Phaser.Display.Color.GetColor(120 + 100 * t, 195 + 35 * t, 245 - 15 * t)); g.fillRect(0, y, 640, 4); }
    g.fillStyle(0x3f9ab8); g.fillRect(0, 110, 640, 30);
    g.fillStyle(0x9ad0de); for (let x = 0; x < 640; x += 30) g.fillRect(x + (x % 60) / 3, 118 + (x % 3) * 6, 14, 2);
    g.fillStyle(0xf1d49a); g.fillRect(0, 140, 640, 220);
    g.fillStyle(0xe6c488); for (let i = 0; i < 160; i++) g.fillRect((i * 97) % 640, 145 + ((i * 53) % 210), 3, 2);
    this.add.image(560, 112, 'br-sugarloaf').setOrigin(0.5, 1).setScale(0.45);
    this.add.sprite(70, 140, 'br-flag', 0).setOrigin(0.08, 1).play('br-flag-wave');

    // the goal (front view)
    const gx0 = 200, gx1 = 440, gy0 = 100, gy1 = 206;
    const goalG = this.add.graphics().setDepth(5);
    goalG.lineStyle(1, 0xffffff, 0.5);
    for (let x = gx0; x <= gx1; x += 8) goalG.lineBetween(x, gy0, x + (x - 320) * 0.08, gy1 - 6);
    for (let y = gy0; y <= gy1; y += 8) goalG.lineBetween(gx0, y, gx1, y);
    goalG.fillStyle(0xffffff); goalG.fillRect(gx0 - 5, gy0 - 5, gx1 - gx0 + 10, 6); goalG.fillRect(gx0 - 5, gy0 - 5, 6, gy1 - gy0 + 5); goalG.fillRect(gx1 - 1, gy0 - 5, 6, gy1 - gy0 + 5);
    goalG.lineStyle(1, 0x5a5a5a); goalG.strokeRect(gx0 - 5, gy0 - 5, gx1 - gx0 + 10, gy1 - gy0 + 5);

    this.ball = this.add.image(320, 318, 'br-ball').setScale(1.8).setDepth(30);
    this.arrow = this.add.triangle(320, 270, 0, 12, 8, 0, 16, 12, 0xffe27a).setDepth(40).setVisible(false);
    this.bar = this.add.graphics().setDepth(40);
    this.info = this.add.text(320, 342, '', { fontFamily: FONT, fontSize: '12px', color: '#2a1a10', align: 'center' }).setOrigin(0.5).setResolution(2).setDepth(50);
    this.score = this.add.text(16, 12, '', { fontFamily: FONT, fontSize: '13px', color: '#ffffff', stroke: '#1a3a48', strokeThickness: 4 }).setResolution(2).setDepth(50);
    this.bubble = this.add.text(320, 74, '', { fontFamily: FONT, fontSize: '12px', color: '#2a1a10', backgroundColor: '#fff6dc', padding: { x: 8, y: 4 } })
      .setOrigin(0.5, 1).setResolution(2).setDepth(60).setVisible(false);

    // you, seen from behind, next to the ball
    this.add.sprite(282, 336, `${this.youKey}-idle`, 0).setOrigin(0.5, 61 / 64).setScale(1.6).setDepth(25);

    const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
    install({ ...YARA_LOOK, shirtColor: 'Green' } as Look).then((key) => {
      if (!this.sys.isActive()) return;
      this.yaraKey = key;
      this.keeper = this.add.sprite(320, 204, `${key}-idle`, 6).setOrigin(0.5, 61 / 64).setScale(1.3).setDepth(20).play(`${key}-idle-down`);
      this.yap(YARA.intro[1]);
      this.time.delayedCall(2200, () => this.nextShot());
    });

    const kb = this.input.keyboard!;
    const press = () => this.press();
    kb.on('keydown-SPACE', press); kb.on('keydown-E', press); kb.on('keydown-ENTER', press);
    this.input.on('pointerdown', press);
    kb.on('keydown-A', () => this.keep(0)); kb.on('keydown-LEFT', () => this.keep(0));
    kb.on('keydown-W', () => this.keep(1)); kb.on('keydown-UP', () => this.keep(1));
    kb.on('keydown-D', () => this.keep(2)); kb.on('keydown-RIGHT', () => this.keep(2));
    kb.on('keydown-ESC', () => this.leave());
    this.updateScore();
    this.cameras.main.fadeIn(300);
  }

  private yap(text: string, ms = 2000) {
    this.bubble.setText(`Yara: ${text}`).setVisible(true);
    this.time.delayedCall(ms, () => this.bubble.setVisible(false));
  }

  private dots?: Phaser.GameObjects.Graphics;
  private updateScore() {
    this.score.setText('Jij\nYara');
    const g = this.dots ?? (this.dots = this.add.graphics().setDepth(50));
    g.clear();
    [this.mine, this.hers].forEach((l, row) => {
      for (let i = 0; i < ROUNDS; i++) {
        const x = 70 + i * 16, y = 21 + row * 17;
        g.fillStyle(0x1a3a48); g.fillCircle(x, y, 6);
        g.fillStyle(i >= l.length ? 0xfff6dc : l[i] ? 0x7cc450 : 0xe8584a); g.fillCircle(x, y, i >= l.length ? 3 : 5);
      }
    });
  }

  private nextShot() {
    if (this.round >= ROUNDS * 2) { this.finish(); return; }
    this.resetKeeper();
    this.ball.setPosition(320, 318).setScale(1.8);
    if (this.round % 2 === 0) {
      this.state = 'aim'; this.aimX = 0; this.aimDir = 1;
      this.arrow.setVisible(true);
      this.info.setText('JIJ SCHIET: druk SPATIE om te mikken');
    } else {
      this.state = 'keep';
      this.arrow.setVisible(false);
      this.info.setText('YARA SCHIET: kies je duik met A (links), W (midden) of D (rechts)!');
      this.dive = null;
      // she runs up after a moment; you have a short window
      this.time.delayedCall(Phaser.Math.Between(900, 1600), () => this.yaraShoots());
    }
  }

  private resetKeeper() {
    if (!this.keeper) return;
    this.keeper.setPosition(320, 204).setAngle(0).play(`${this.yaraKey}-idle-down`);
  }

  private press() {
    if (this.state === 'aim') {
      this.state = 'power'; this.power = 0; this.powerDir = 1;
      this.info.setText('Druk nog een keer SPATIE voor de kracht. Niet te hard!');
    } else if (this.state === 'power') {
      this.shoot();
    } else if (this.state === 'done') {
      this.leave();
    }
  }

  private zoneOf(x: number): Zone { return x < -0.33 ? 0 : x > 0.33 ? 2 : 1; }

  private shoot() {
    this.state = 'flying';
    this.arrow.setVisible(false); this.bar.clear();
    const tx = 320 + this.aimX * 112;
    const over = this.power > 0.88;
    const ty = over ? 70 : 196 - this.power * 84;
    // Yara guesses (she is good, but not that good)
    const guess = Phaser.Math.RND.pick([0, 1, 2]) as Zone;
    const zone = this.zoneOf(this.aimX);
    this.diveKeeper(guess, 380);
    this.tweens.add({
      targets: this.ball, x: tx, y: ty, scale: 0.9, duration: 420, ease: 'Quad.easeOut',
      onComplete: () => {
        const corner = Math.abs(this.aimX) > 0.8 && this.power > 0.55;   // top corner: unstoppable
        const saved = !over && guess === zone && !corner;
        const goal = !over && !saved;
        this.mine.push(goal);
        this.updateScore();
        if (saved) this.tweens.add({ targets: this.ball, x: tx + (tx < 320 ? -60 : 60), y: 260, duration: 300 });
        this.info.setText(goal ? 'GOOOOOL!' : over ? 'Over! Veel te hard.' : 'Gestopt door Yara!');
        if (goal) this.cameras.main.shake(150, 0.005);
        this.yap(goal ? Phaser.Math.RND.pick(['Die liet ik expres door.', 'Hmpf. Geluk.', 'Mijn handschoenen zijn nat.']) : Phaser.Math.RND.pick(['HA! Zag je dat?', 'Te makkelijk.', 'Mama, heb je dat gezien?!']));
        this.round++;
        this.time.delayedCall(1700, () => this.nextShot());
      },
    });
  }

  private diveKeeper(z: Zone, ms: number) {
    if (!this.keeper) return;
    if (z === 1) { this.tweens.add({ targets: this.keeper, y: 196, duration: ms / 2, yoyo: true }); return; }
    const dx = z === 0 ? -90 : 90;
    this.keeper.play(`${this.yaraKey}-idle-${z === 0 ? 'left' : 'right'}`);
    this.tweens.add({ targets: this.keeper, x: 320 + dx, y: 214, angle: z === 0 ? -80 : 80, duration: ms, ease: 'Quad.easeOut' });
  }

  private keep(z: Zone) {
    if (this.state !== 'keep' && this.state !== 'keepwait') return;
    if (this.dive !== null) return;
    this.dive = z;
    this.info.setText(['Je duikt naar links!', 'Je blijft staan!', 'Je duikt naar rechts!'][z]);
  }

  private yaraShoots() {
    if (this.state !== 'keep') return;
    this.state = 'keepwait';
    this.yap(Phaser.Math.RND.pick(['Kijk en leer.', 'Deze gaat erin.', 'Let op, hè.']), 1200);
    this.time.delayedCall(450, () => {
      const z = Phaser.Math.RND.pick([0, 0, 1, 2, 2]) as Zone;
      const miss = Math.random() < 0.12;
      const tx = [218, 320, 422][z] + (miss ? (z === 0 ? -40 : 40) : 0);
      // you are the keeper now: show your dive with the arrow
      if (this.dive !== null) this.showYouDive(this.dive);
      this.tweens.add({
        targets: this.ball, x: tx, y: miss ? 90 : 170, scale: 0.9, duration: 380, ease: 'Quad.easeOut',
        onComplete: () => {
          const saved = !miss && this.dive === z;
          const goal = !miss && !saved;
          this.hers.push(goal);
          this.updateScore();
          this.info.setText(saved ? 'GERED! Wat een redding!' : miss ? 'Naast! Yara mist!' : 'Yara scoort.');
          if (saved) this.cameras.main.flash(150, 255, 255, 255);
          this.yap(goal ? Phaser.Math.RND.pick(['Natuurlijk.', 'Zo doe je dat.', 'Makkelijk.']) : saved ? Phaser.Math.RND.pick(['Dat telt niet, ik gleed uit!', 'Wat?! Opnieuw!', 'Nee. Nee nee nee.']) : 'Het zand is scheef hier!');
          this.round++;
          this.time.delayedCall(1700, () => { this.you?.destroy(); this.nextShot(); });
        },
      });
    });
  }

  private you?: Phaser.GameObjects.Arc;
  private showYouDive(z: Zone) {
    // a big green glove where you dive
    this.you = this.add.circle([218, 320, 422][z], 176, 16, 0x7cc450, 0.85).setStrokeStyle(3, 0x2a1a10).setDepth(45);
  }

  private finish() {
    this.state = 'done';
    this.resetKeeper();
    const a = this.mine.filter(Boolean).length, b = this.hers.filter(Boolean).length;
    const s = loadBrasil();
    s.yara = true; s.penaltyGames = (s.penaltyGames ?? 0) + 1; if (a > b) s.penaltyWins = (s.penaltyWins ?? 0) + 1;
    saveBrasil(s);
    const lines = a > b ? YARA.won : a < b ? YARA.lost : YARA.draw;
    this.yap(lines[0], 6000);
    const t = `${a > b ? 'JIJ WINT!' : a < b ? 'Yara wint...' : 'Gelijkspel!'}   ${a} - ${b}`;
    const card = this.add.text(320, 250, `${t}\n${lines[1]}\nGewonnen van Yara: ${s.penaltyWins ?? 0} van de ${s.penaltyGames} keer\n\nSPATIE: terug naar het strand`, {
      fontFamily: FONT, fontSize: '13px', color: '#fff6dc', align: 'center', backgroundColor: '#2a1a10', padding: { x: 14, y: 10 },
    }).setOrigin(0.5).setResolution(2).setDepth(100);
    card.setAlpha(0); this.tweens.add({ targets: card, alpha: 1, duration: 400 });
    this.info.setText('');
  }

  private leave() {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('brasil', { arrive: { x: goal.x * T, y: (goal.y + 4.2) * T, facing: 'up' } }));
  }

  update(_t: number, delta: number) {
    const dt = delta / 1000;
    if (this.state === 'aim') {
      this.aimX += this.aimDir * dt * 1.6;
      if (Math.abs(this.aimX) > 1) { this.aimX = Phaser.Math.Clamp(this.aimX, -1, 1); this.aimDir *= -1; }
      this.arrow.setPosition(320 + this.aimX * 112, 230);
    } else if (this.state === 'power') {
      this.power += this.powerDir * dt * 1.4;
      if (this.power > 1 || this.power < 0) { this.power = Phaser.Math.Clamp(this.power, 0, 1); this.powerDir *= -1; }
      this.arrow.setPosition(320 + this.aimX * 112, 230);
      const b = this.bar; b.clear();
      b.fillStyle(0x2a1a10, 0.85); b.fillRect(520, 200, 22, 120);
      b.fillStyle(0xe8584a); b.fillRect(523, 203, 16, 114 * 0.12);
      b.fillStyle(0x7cc450); b.fillRect(523, 203 + 114 * 0.12, 16, 114 * 0.88);
      b.fillStyle(0xffffff); b.fillRect(518, 317 - 114 * this.power, 26, 3);
    }
  }
}
