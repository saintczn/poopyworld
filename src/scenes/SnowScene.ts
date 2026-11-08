import Phaser from 'phaser';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient } from '../world/ambient';

const W = 30 * 32, H = 18 * 32;
const FONT = '"Pixelify Sans", "Courier New", monospace';

/** Draws a snowy ground texture once. */
export function paintSnow(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const c = tex.getContext();
  c.fillStyle = '#eef3fa'; c.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < (w * h) / 40; i++) {
    const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
    c.fillStyle = rnd() < 0.5 ? '#dfe8f4' : '#ffffff'; c.fillRect(x, y, 2, 1);
  }
  // soft drifts
  for (let i = 0; i < 40; i++) {
    const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 50;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(200,215,235,0.35)'); g.addColorStop(1, 'rgba(200,215,235,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  tex.refresh();
}

/** Falling snow for any scene. */
export function snowfall(scene: Phaser.Scene, count = 70) {
  const flakes: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < count; i++) {
    const f = scene.add.image(Phaser.Math.Between(0, 640), Phaser.Math.Between(0, 360), 'dot')
      .setScrollFactor(0).setDepth(90003).setAlpha(Phaser.Math.FloatBetween(0.5, 1)).setScale(Phaser.Math.FloatBetween(0.6, 1.4));
    f.setData('v', Phaser.Math.FloatBetween(18, 45)); f.setData('p', Math.random() * 6);
    flakes.push(f);
  }
  scene.events.on('update', (time: number, delta: number) => {
    for (const f of flakes) {
      f.y += (f.getData('v') as number) * delta / 1000;
      f.x += Math.sin(time / 900 + (f.getData('p') as number)) * 0.3;
      if (f.y > 365) { f.y = -4; f.x = Phaser.Math.Between(0, 640); }
    }
  });
}

/**
 * Inside the snow globe: a snowy garden where Simba dives into the snow piles,
 * just like he used to. And you can build a snowman.
 */
export class SnowScene extends WorldScene {
  private ambient!: Ambient;
  private simba!: Phaser.GameObjects.Sprite;
  private piles: Array<{ img: Phaser.GameObjects.Image; x: number; y: number }> = [];
  private busy = false;
  private snowman = 0;

  constructor() {
    super('snow');
  }

  protected build(): Arrival {
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H).setBackgroundColor('#dfe8f4');
    paintSnow(this, 'snow-ground', W, H);
    this.add.image(0, 0, 'snow-ground').setOrigin(0).setDepth(-1000);
    this.busy = false; this.snowman = 0; this.piles = [];

    // snowy pines around the edge
    const pine = (key: string, x: number, y: number) => this.place(key, x, y, [16, 10]).setTint(0xd8e4f0);
    for (let x = 30; x < W; x += 70) { pine(x % 140 < 70 ? 'pine-a' : 'pine-b', x, 70); }
    for (let y = 150; y < H - 40; y += 90) { pine('pine-c', 26, y); pine('pine-a', W - 26, y + 40); }
    for (let x = 60; x < W; x += 120) if (Math.abs(x - W / 2) > 70) pine('pine-b', x, H - 8);
    this.solid(0, 0, W, 80); this.solid(0, 0, 40, H); this.solid(W - 40, 0, 40, H); this.solid(0, H - 30, W, 30);

    // snow piles
    for (const [x, y] of [[200, 220], [330, 330], [520, 250], [660, 380], [780, 230], [430, 440], [240, 450]]) {
      const img = this.add.image(x, y, 'snow-pile').setOrigin(0.5, 0.8).setDepth(y);
      this.piles.push({ img, x, y });
    }

    // a sign
    this.place('sign', 480, 132, [12, 8]);
    this.interactables.push({ id: 'sign', at: { x: 480, y: 146 }, who: 'Bordje', lines: ['"Simba\'s Sneeuwtuin"', 'Toegang alleen voor katten. En voor mensen die van katten houden.'] });

    // Simba
    this.simba = this.add.sprite(330, 300, 'cat', 16).setOrigin(0.5, 30 / 32);
    this.interactables.push({ id: 'simba', at: { x: 0, y: 0 }, who: 'Simba', lines: [], action: () => this.simbaTalk() });
    this.time.delayedCall(1500, () => this.simbaLoop());

    // snowman spot
    const sm = this.add.image(700, 170, 'snowman-1').setOrigin(0.5, 1).setDepth(170).setVisible(false);
    this.interactables.push({
      id: 'snowman', at: { x: 700, y: 182 }, who: 'Sneeuwpop', lines: [],
      action: () => {
        this.snowman = Math.min(3, this.snowman + 1);
        sm.setTexture(`snowman-${this.snowman}`).setVisible(true);
        this.solid(688, 160, 24, 12);
        const lines = [
          ['Je rolt een grote sneeuwbal. De onderkant van de sneeuwpop!'],
          ['Nog een bal erop. Hij begint ergens op te lijken.'],
          ['Een hoofd, een wortel als neus, een sjaal en een hoge hoed. Klaar!', 'Simba kijkt er wantrouwig naar.'],
        ][this.snowman - 1];
        this.say('Sneeuwpop', this.snowman === 3 && sm.getData('done') ? ['Hij is af. Hij is prachtig. Simba is nog steeds niet overtuigd.'] : lines);
        if (this.snowman === 3) sm.setData('done', true);
      },
    });

    // the way out: the edge of the globe
    this.interactables.push({ id: 'out', at: { x: W / 2, y: H - 48 }, who: 'Sneeuwbol', lines: [],
      action: () => this.say('Sneeuwbol', ['Je knippert, en je staat weer in de woonkamer met de sneeuwbol in je handen.'], () => this.travel('house', { x: 216, y: 190, facing: 'down' })) });
    this.add.text(W / 2, H - 44, '▼ terug naar huis', { fontFamily: FONT, fontSize: '10px', color: '#5a6f8a' }).setOrigin(0.5).setResolution(2).setDepth(5);

    snowfall(this);
    this.ambient = new Ambient(this, { w: W, h: H }, [], [], undefined, true, { tint: [225, 232, 255], night: 0 });
    return { x: W / 2, y: H - 70, facing: 'up' };
  }

  private simbaTalk() {
    const lines = [
      ['Simba! Een zwarte kat in een witte wereld. Hij is niet bepaald onopvallend.', 'Hij kijkt je aan, kijkt naar de sneeuwhoop... en springt.'],
      ['Miauw.', 'Vertaling: "Ik ben de koning van deze sneeuwtuin."'],
      ['Simba heeft sneeuw op zijn snoet en is daar heel tevreden mee.'],
      ['Je aait Simba. Hij spint zo hard dat de sneeuw ervan trilt.'],
    ];
    const n = (this.simba.getData('talks') ?? 0) as number;
    this.simba.setData('talks', n + 1);
    this.say('Simba', lines[n % lines.length], () => { if (!this.busy) this.pounce(); });
  }

  /** Walks somewhere, sits a bit, and every now and then dives into a pile. */
  private simbaLoop() {
    if (!this.sys.isActive() || this.busy) return;
    if (Math.random() < 0.55) { this.pounce(); return; }
    const tx = Phaser.Math.Between(120, W - 120), ty = Phaser.Math.Between(170, H - 80);
    const dx = tx - this.simba.x, dy = ty - this.simba.y;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    this.simba.play(`cat-walk-${dir}`);
    this.tweens.add({
      targets: this.simba, x: tx, y: ty, duration: Math.hypot(dx, dy) * 22,
      onComplete: () => { this.simba.stop().setFrame(16); this.time.delayedCall(Phaser.Math.Between(1200, 3000), () => this.simbaLoop()); },
    });
  }

  /** The famous Simba dive: crouch, leap, vanish into the snow, pop out. */
  private pounce() {
    if (this.busy) return;
    this.busy = true;
    const s = this.simba;
    const pile = Phaser.Math.RND.pick(this.piles);
    const fromRight = s.x > pile.x;
    // walk to a spot next to the pile
    const sx = pile.x + (fromRight ? 70 : -70), sy = pile.y;
    s.play(`cat-walk-${fromRight ? 'left' : 'right'}`).setFlipX(false);
    this.tweens.add({
      targets: s, x: sx, y: sy, duration: Math.max(300, Phaser.Math.Distance.Between(s.x, s.y, sx, sy) * 18),
      onComplete: () => {
        s.stop().setFrame(fromRight ? 8 : 12);
        // wiggle the bum before jumping
        this.tweens.add({
          targets: s, x: s.x + 1.5, duration: 60, yoyo: true, repeat: 5,
          onComplete: () => {
            s.setFrame(17).setFlipX(fromRight);
            const st = { k: 0 };
            this.tweens.add({
              targets: st, k: 1, duration: 520, ease: 'Sine.easeIn',
              onUpdate: () => s.setPosition(sx + (pile.x - sx) * st.k, sy - Math.sin(st.k * Math.PI) * 46),
              onComplete: () => {
                this.poof(pile.x, pile.y - 8);
                s.setFrame(18).setFlipX(false).setPosition(pile.x, pile.y - 2);
                this.tweens.add({ targets: pile.img, scaleY: 0.8, duration: 120, yoyo: true });
                this.time.delayedCall(900, () => {
                  s.setFrame(19);
                  this.poof(pile.x, pile.y - 12);
                  this.time.delayedCall(900, () => {
                    s.setPosition(pile.x + 22, pile.y + 6).setFrame(16);
                    this.busy = false;
                    this.time.delayedCall(Phaser.Math.Between(2500, 5000), () => this.simbaLoop());
                  });
                });
              },
            });
          },
        });
      },
    });
  }

  private poof(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const d = this.add.image(x, y, 'dot').setScale(Phaser.Math.FloatBetween(1, 2.5)).setDepth(y + 60);
      this.tweens.add({ targets: d, x: x + Phaser.Math.Between(-30, 30), y: y - Phaser.Math.Between(6, 34), alpha: 0, duration: Phaser.Math.Between(400, 800), ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  protected tick(time: number) {
    this.ambient.update(time);
    const s = this.simba;
    if (!s) return;
    s.setDepth(s.y + 1);
    const it = this.interactables.find((i) => i.id === 'simba')!;
    it.at.x = s.x; it.at.y = this.busy ? -9999 : s.y + 4;
  }
}
