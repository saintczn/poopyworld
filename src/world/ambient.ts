/**
 * Makes a map feel alive: real-clock day and night (Amsterdam time on the player's device),
 * glowing lamps after dark, fireflies at night, butterflies by day and sparkles on water.
 */
import Phaser from 'phaser';
import { VIEW_WIDTH, VIEW_HEIGHT } from '../config';

export type LightSpot = { x: number; y: number; size: number; flicker?: boolean; colour?: number; always?: number };

export type Phase = { tint: [number, number, number]; night: number };

/** The light at a given hour (0-24). tint is multiplied over the world; night is 0..1. */
export function phaseAt(hour: number): Phase {
  const keys: Array<[number, [number, number, number], number]> = [
    [0, [92, 104, 168], 1],
    [5, [92, 104, 168], 1],
    [6.5, [255, 196, 170], 0.25],
    [8, [255, 255, 255], 0],
    [17, [255, 255, 255], 0],
    [19, [255, 206, 150], 0.15],
    [20.5, [168, 140, 190], 0.6],
    [22, [92, 104, 168], 1],
    [24, [92, 104, 168], 1],
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    const [h0, c0, n0] = keys[i], [h1, c1, n1] = keys[i + 1];
    if (hour >= h0 && hour <= h1) {
      const t = (hour - h0) / (h1 - h0);
      return { tint: [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * t)) as [number, number, number], night: n0 + (n1 - n0) * t };
    }
  }
  return { tint: [255, 255, 255], night: 0 };
}

function currentHour() {
  const forced = new URLSearchParams(location.search).get('time');
  if (forced) return Number(forced);
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export function buildAmbientTextures(scene: Phaser.Scene) {
  // soft round glow
  const glow = scene.textures.createCanvas('glow', 128, 128)!;
  const g = glow.getContext();
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glow.refresh();

  // butterflies: 3 colours x 2 frames (8x7 each)
  const bf = scene.textures.createCanvas('butterfly', 48, 7)!;
  const b = bf.getContext();
  const colours = [['#f7b733', '#c97d10'], ['#ffffff', '#b9c4d6'], ['#7ec8f2', '#3f86c4']];
  colours.forEach(([wing, edge], i) => {
    const ox = i * 16;
    const px = (x: number, y: number, w: number, h: number, c: string) => { b.fillStyle = c; b.fillRect(ox + x, y, w, h); };
    // frame 0: wings open
    px(1, 0, 3, 3, wing); px(4, 0, 3, 3, wing); px(1, 3, 2, 2, edge); px(5, 3, 2, 2, edge); px(0, 0, 1, 2, edge); px(7, 0, 1, 2, edge);
    px(3, 1, 2, 5, '#3b2a1e');
    // frame 1: wings folded up
    px(10, 0, 2, 3, wing); px(12, 0, 2, 3, wing); px(10, 3, 1, 1, edge); px(13, 3, 1, 1, edge);
    px(11, 1, 2, 5, '#3b2a1e');
  });
  bf.refresh();
  for (let i = 0; i < 3; i++) {
    bf.add(`b${i}-0`, 0, i * 16, 0, 8, 7);
    bf.add(`b${i}-1`, 0, i * 16 + 8, 0, 8, 7);
    scene.anims.create({ key: `flutter-${i}`, frames: [{ key: 'butterfly', frame: `b${i}-0` }, { key: 'butterfly', frame: `b${i}-1` }], frameRate: 9, repeat: -1 });
  }

  // tiny dots: firefly + water sparkle
  const dot = scene.textures.createCanvas('dot', 3, 3)!;
  const d = dot.getContext();
  d.fillStyle = '#ffffff';
  d.fillRect(1, 0, 1, 3);
  d.fillRect(0, 1, 3, 1);
  dot.refresh();
}

export class Ambient {
  private overlay: Phaser.GameObjects.Rectangle;
  private lights: Array<{ img: Phaser.GameObjects.Image; spot: LightSpot }> = [];
  private fireflies: Phaser.GameObjects.Image[] = [];
  private butterflies: Phaser.GameObjects.Sprite[] = [];
  private phase: Phase = { tint: [255, 255, 255], night: 0 };
  private lastPhaseCheck = -1e9;

  constructor(
    private scene: Phaser.Scene,
    area: { w: number; h: number },
    lights: LightSpot[],
    flowers: Array<{ x: number; y: number }>,
    water?: { x: number; y: number; w: number; h: number },
    private indoor = false,
    private fixed?: Phase,
  ) {
    this.overlay = scene.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0xffffff)
      .setOrigin(0).setScrollFactor(0).setDepth(90000).setBlendMode(Phaser.BlendModes.MULTIPLY);

    for (const spot of lights) {
      const img = scene.add.image(spot.x, spot.y, 'glow').setDepth(90001).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(spot.colour ?? 0xffc86a).setScale(spot.size / 128).setAlpha(0);
      this.lights.push({ img, spot });
    }

    const r = Phaser.Math.RND;
    // fireflies (visible at night)
    for (let i = 0; i < (indoor ? 0 : 26); i++) {
      const f = scene.add.image(r.between(80, area.w - 80), r.between(120, area.h - 60), 'dot')
        .setDepth(90002).setBlendMode(Phaser.BlendModes.ADD).setTint(0xd8ff7a).setAlpha(0);
      this.fireflies.push(f);
      this.drift(f, 40);
    }
    // butterflies (visible by day), each living near a flower
    for (let i = 0; i < 7 && flowers.length; i++) {
      const home = flowers[Math.floor(r.frac() * flowers.length)];
      const b = scene.add.sprite(home.x, home.y - 20, 'butterfly').setDepth(home.y + 40).play({ key: `flutter-${i % 3}`, startFrame: i % 2 });
      b.setData('home', home);
      this.butterflies.push(b);
      this.flutter(b);
    }
    // sparkles on the water
    if (water) {
      scene.time.addEvent({
        delay: 220, loop: true, callback: () => {
          const s = scene.add.image(r.between(water.x, water.x + water.w), r.between(water.y, water.y + water.h), 'dot')
            .setDepth(-490).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
          scene.tweens.add({ targets: s, alpha: { from: 0, to: 0.9 }, yoyo: true, duration: 380, onComplete: () => s.destroy() });
        },
      });
    }
    this.update(0);
  }

  private drift(f: Phaser.GameObjects.Image, range: number) {
    const r = Phaser.Math.RND;
    this.scene.tweens.add({
      targets: f, x: f.x + r.between(-range, range), y: f.y + r.between(-range, range), duration: r.between(2500, 5000),
      ease: 'Sine.easeInOut', onComplete: () => this.drift(f, range),
    });
  }

  private flutter(b: Phaser.GameObjects.Sprite) {
    const r = Phaser.Math.RND;
    const home = b.getData('home') as { x: number; y: number };
    const tx = home.x + r.between(-70, 70), ty = home.y - r.between(8, 60);
    b.setFlipX(tx < b.x);
    this.scene.tweens.add({
      targets: b, x: tx, y: ty, duration: r.between(1400, 2600), ease: 'Sine.easeInOut',
      onUpdate: () => b.setDepth(b.y + 40), onComplete: () => this.flutter(b),
    });
  }

  update(time: number) {
    if (time - this.lastPhaseCheck > 5000) {
      this.lastPhaseCheck = time;
      this.phase = this.fixed ?? phaseAt(currentHour());
      if (this.indoor) {
        // Inside, lamps are on: the night only dims things a little.
        this.phase = { tint: this.phase.tint.map((c) => Math.round(c + (255 - c) * 0.55)) as [number, number, number], night: Math.max(0.35, this.phase.night) };
      }
      const [r, g, b] = this.phase.tint;
      this.overlay.setFillStyle((r << 16) | (g << 8) | b);
      const n = this.phase.night;
      for (const b2 of this.butterflies) b2.setVisible(n < 0.5);
      for (const f of this.fireflies) f.setVisible(n > 0.4);
    }
    const n = this.phase.night;
    for (const { img, spot } of this.lights) {
      const flick = spot.flicker ? 0.85 + Math.sin(time / 90 + spot.x) * 0.08 + Math.sin(time / 37) * 0.05 : 1;
      img.setAlpha(Math.max(n * 0.75, spot.always ?? 0) * flick);
    }
    if (n > 0.4) {
      for (let i = 0; i < this.fireflies.length; i++) {
        this.fireflies[i].setAlpha((0.5 + 0.5 * Math.sin(time / 400 + i * 1.7)) * n);
      }
    }
  }
}
