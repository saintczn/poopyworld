/**
 * Outdoor atmosphere: the season (falling leaves, blossom, snow on the ground) and the real weather
 * (rain, thunder, fog, snow). Add one to any outdoor scene: new Atmosphere(scene, { snowGround: true }).
 */
import Phaser from 'phaser';
import { VIEW_WIDTH as W, VIEW_HEIGHT as H } from '../config';
import { season, type Season } from './season';
import { weatherNow, refreshWeather, type Weather } from './weather';

type Bit = { img: Phaser.GameObjects.Image; vx: number; vy: number; spin: number; sway: number; phase: number };

function makeTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('fx-bits')) return;
  const t = scene.textures.createCanvas('fx-bits', 40, 8)!;
  const c = t.getContext();
  const px = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  // leaves (3 colours), 5x4 each
  [['#d8622a', '#a8401a'], ['#e8a030', '#b87010'], ['#c8402a', '#8a2a1a']].forEach(([a, b], i) => {
    const o = i * 6;
    px(o + 1, 0, 3, 1, a); px(o, 1, 5, 2, a); px(o + 1, 3, 2, 1, a); px(o + 2, 1, 1, 3, b);
  });
  // petals, 3x3
  px(18, 0, 2, 1, '#ffd0e0'); px(18, 1, 3, 1, '#ffb8d0'); px(19, 2, 1, 1, '#f8a0c0');
  px(22, 0, 3, 1, '#ffffff'); px(22, 1, 2, 1, '#ffe0ec');
  // rain drop 1x6
  px(26, 0, 1, 7, '#c8dcf0');
  t.refresh();
  t.add('leaf-0', 0, 0, 0, 5, 4); t.add('leaf-1', 0, 6, 0, 5, 4); t.add('leaf-2', 0, 12, 0, 5, 4);
  t.add('petal-0', 0, 18, 0, 3, 3); t.add('petal-1', 0, 22, 0, 3, 2);
  t.add('drop', 0, 26, 0, 1, 7);
}

export class Atmosphere {
  readonly season: Season;
  weather: Weather;
  private bits: Bit[] = [];
  private drops: Phaser.GameObjects.Image[] = [];
  private fog: Phaser.GameObjects.Image[] = [];
  private nextFlash = 0;
  tintRect?: Phaser.GameObjects.Rectangle;

  constructor(private scene: Phaser.Scene, opts: { area?: { w: number; h: number }; snowGround?: boolean } = {}) {
    makeTextures(scene);
    this.season = season();
    this.weather = weatherNow().weather;
    if (this.season === 'autumn') this.falling('leaf', 22);
    if (this.season === 'spring') this.falling('petal', 18);
    if (this.season === 'winter' && opts.snowGround && opts.area) {
      scene.add.rectangle(0, 0, opts.area.w, opts.area.h, 0xf4f8ff, 0.55).setOrigin(0).setDepth(-900);
    }
    this.startWeather(this.weather);
    // look up the real weather; if it changed, show it straight away
    refreshWeather().then((w) => {
      if (!scene.sys.isActive() || w.weather === this.weather) return;
      this.weather = w.weather;
      this.startWeather(w.weather);
    });
    scene.events.on('update', (time: number, delta: number) => this.update(time, delta));
  }

  /** A warm or cold tint for trees, by season (or undefined for none). */
  treeTint(): number | undefined {
    return this.season === 'autumn' ? 0xffc890 : this.season === 'winter' ? 0xd8e4f0 : undefined;
  }

  private falling(kind: 'leaf' | 'petal', n: number) {
    const r = Phaser.Math.RND;
    for (let i = 0; i < n; i++) {
      const img = this.scene.add.image(r.between(0, W), r.between(-H, H), 'fx-bits', kind === 'leaf' ? `leaf-${i % 3}` : `petal-${i % 2}`)
        .setScrollFactor(0).setDepth(90003).setScale(kind === 'leaf' ? 1.6 : 1.4);
      this.bits.push({ img, vx: r.between(-14, -4), vy: r.between(16, 34), spin: r.realInRange(-3, 3), sway: r.between(10, 26), phase: r.realInRange(0, 6) });
    }
  }

  private startWeather(w: Weather) {
    const s = this.scene;
    if ((w === 'rain' || w === 'storm') && !this.drops.length) {
      this.tintRect = s.add.rectangle(0, 0, W, H, 0x9aa8bc).setOrigin(0).setScrollFactor(0).setDepth(90000).setBlendMode(Phaser.BlendModes.MULTIPLY);
      const n = w === 'storm' ? 140 : 90;
      for (let i = 0; i < n; i++) {
        this.drops.push(s.add.image(Phaser.Math.Between(0, W + 60), Phaser.Math.Between(0, H), 'fx-bits', 'drop')
          .setScrollFactor(0).setDepth(90004).setAlpha(Phaser.Math.FloatBetween(0.4, 0.8)).setRotation(0.25).setScale(1, Phaser.Math.FloatBetween(1, 1.8)));
      }
    }
    if (w === 'fog' && !this.fog.length) {
      for (let i = 0; i < 7; i++) {
        const f = s.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(40, H), 'glow').setScrollFactor(0.4).setDepth(90004)
          .setScale(Phaser.Math.FloatBetween(3, 5), Phaser.Math.FloatBetween(1.4, 2.2)).setAlpha(0.22);
        this.fog.push(f);
        s.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-80, 80), duration: Phaser.Math.Between(9000, 15000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      this.tintRect = s.add.rectangle(0, 0, W, H, 0xd8dce4).setOrigin(0).setScrollFactor(0).setDepth(90000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    }
    if (w === 'snow' && !this.bits.some((b) => b.img.texture.key === 'dot')) {
      for (let i = 0; i < 70; i++) {
        const img = s.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 'dot').setScrollFactor(0).setDepth(90003).setAlpha(Phaser.Math.FloatBetween(0.5, 1));
        this.bits.push({ img, vx: Phaser.Math.Between(-6, 6), vy: Phaser.Math.Between(18, 42), spin: 0, sway: 6, phase: Math.random() * 6 });
      }
    }
  }

  private update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    for (const b of this.bits) {
      b.img.y += b.vy * dt;
      b.img.x += (b.vx + Math.sin(time / 700 + b.phase) * b.sway) * dt;
      b.img.rotation += b.spin * dt;
      if (b.img.y > H + 6) { b.img.y = -6; b.img.x = Phaser.Math.Between(0, W + 40); }
      if (b.img.x < -10) b.img.x = W + 8;
    }
    for (const d of this.drops) {
      d.y += 520 * dt; d.x -= 130 * dt;
      if (d.y > H + 8) {
        // a little splash where it lands
        if (Math.random() < 0.15) {
          const s = this.scene.add.image(d.x, H - Phaser.Math.Between(4, 200), 'dot').setScrollFactor(0).setDepth(90004).setAlpha(0.6).setTint(0xc8dcf0);
          this.scene.tweens.add({ targets: s, scale: 2, alpha: 0, duration: 260, onComplete: () => s.destroy() });
        }
        d.y = Phaser.Math.Between(-30, -4); d.x = Phaser.Math.Between(0, W + 80);
      }
    }
    if (this.weather === 'storm' && time > this.nextFlash) {
      this.nextFlash = time + Phaser.Math.Between(8000, 16000);
      if (this.nextFlash - 8000 > 0) {
        this.scene.cameras.main.flash(120, 230, 235, 255);
        this.scene.time.delayedCall(180, () => this.scene.cameras.main.flash(80, 230, 235, 255));
        this.scene.time.delayedCall(900, () => this.scene.cameras.main.shake(300, 0.002));
      }
    }
  }
}
