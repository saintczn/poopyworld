import Phaser from 'phaser';
import { Atmosphere } from '../world/atmosphere';
import { TILE } from '../config';
import { paintGround } from '../world/ground';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, type LightSpot } from '../world/ambient';

const T = TILE;
const W = 24, H = 16;
const MANOR = { x: 192, y: 34 };

/** The hill with Hollowmere Manor: dusk all day, mist, an iron fence and bare trees. */
export class ManorGrounds extends WorldScene {
  private ambient!: Ambient;

  constructor() {
    super('manor-grounds');
  }

  protected build(): Arrival {
    new Atmosphere(this);
    this.physics.world.setBounds(0, 0, W * T, H * T);
    this.cameras.main.setBounds(0, 0, W * T, H * T).setBackgroundColor('#1c241c');
    paintGround(this, 'manor-ground', {
      w: W, h: H, seed: 13,
      dirt: [{ x: 8, y: 8, w: 2, h: 8 }, { x: 6, y: 7, w: 6, h: 1 }, { x: 4, y: 7, w: 16, h: 1 }],
    });
    this.add.image(0, 0, 'manor-ground').setOrigin(0).setDepth(-1000).setTint(0xb8c0b0);

    // the manor
    this.add.image(MANOR.x, MANOR.y, 'manor').setOrigin(0).setDepth(MANOR.y + 192);
    const m = MANOR;
    this.solid(m.x + 32, m.y + 100, 256, 76);
    this.solid(m.x + 32, m.y + 176, 32, 16);
    this.solid(m.x + 96, m.y + 176, 192, 16);
    this.solid(m.x + 288, m.y + 70, 64, 90);
    this.solid(m.x + 22, m.y + 60, 10, 120);
    this.interactables.push({ id: 'manor-door', at: { x: m.x + 80, y: m.y + 206 }, who: 'Hollowmere Manor', lines: [], action: () => this.enter() });

    // iron fence along the front, with a gap for the path
    for (let x = 1; x < W - 1; x++) if (x < 8 || x > 9) this.add.image(x * T, 11 * T, 'iron-fence').setOrigin(0).setDepth(11 * T + 28);
    this.solid(T, 11 * T + 18, 7 * T, 12);
    this.solid(10 * T, 11 * T + 18, (W - 11) * T, 12);
    this.interactables.push({ id: 'gate', at: { x: 9 * T, y: 12 * T + 8 }, who: 'Ijzeren hek', lines: ['Het hek staat op een kier. Op een roestig bordje staat: HOLLOWMERE.', 'Je hoort ergens een uil. Of iets dat op een uil lijkt.'] });

    // bare and dark trees
    const trees: Array<[string, number, number]> = [
      ['tree-bare', 2.2, 7.2], ['pine-a', 4.4, 4.4], ['pine-c', 1.2, 12.6], ['tree-bare', 20.8, 7.4], ['pine-b', 22.6, 4.6],
      ['pine-a', 22.4, 13.2], ['tree-bare', 15.4, 14.6], ['pine-c', 4.2, 15.4], ['tree-d', 19.0, 15.6], ['tree-bare', 12.6, 12.8],
    ];
    for (const [k, x, y] of trees) {
      this.place(k, x * T, y * T, [22, 10]).setTint(0xa8b0b8);
    }
    for (const [k, x, y] of [['rock-big', 6.0, 13.6], ['rock-mid', 14.6, 9.6], ['tall-grass-c', 11.4, 14.4], ['tall-grass-b', 3.2, 9.6], ['fern', 18.0, 12.0]] as const) this.place(k, x * T, y * T).setTint(0xb0b8b0);

    // edges; the path back down to Heartwood at the bottom
    this.solid(0, 0, W * T, 1.2 * T);
    this.solid(0, 0, 0.8 * T, H * T);
    this.solid((W - 0.8) * T, 0, T, H * T);

    // mist drifting across
    for (let i = 0; i < 9; i++) {
      const fog = this.add.image(Phaser.Math.Between(0, W * T), Phaser.Math.Between(80, H * T), 'glow')
        .setScale(Phaser.Math.FloatBetween(2.5, 4.5), Phaser.Math.FloatBetween(0.8, 1.4)).setAlpha(0.09).setDepth(80000).setTint(0xd8e0f0);
      this.tweens.add({ targets: fog, x: fog.x + Phaser.Math.Between(120, 260), duration: Phaser.Math.Between(9000, 16000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const lights: LightSpot[] = [
      { x: m.x + 164, y: m.y + 145, size: 80, colour: 0xffc070, flicker: true, always: 0.5 },
      { x: m.x + 270, y: m.y + 145, size: 80, colour: 0xffc070, flicker: true, always: 0.35 },
      { x: m.x + 320, y: m.y + 112, size: 70, colour: 0xffc070, flicker: true, always: 0.25 },
      { x: m.x + 80, y: m.y + 150, size: 60, colour: 0xffc070, flicker: true, always: 0.4 },
    ];
    this.ambient = new Ambient(this, { w: W * T, h: H * T }, lights, [], undefined, false, { tint: [128, 120, 170], night: 0.75 });
    return { x: 9 * T, y: (H - 0.8) * T, facing: 'up' };
  }

  private enter() {
    this.travel('manor', { x: 224, y: 370, facing: 'up' });
  }

  protected tick(time: number) {
    this.ambient.update(time);
    const p = this.player;
    if (!p || !this.registry.get('started')) return;
    if (p.y > H * T - 6) this.travel('village', { x: 41.6 * T, y: 25.5 * T, facing: 'left' });
    if (Math.abs(p.x - (MANOR.x + 80)) < 22 && p.y < MANOR.y + 210 && p.facing === 'up') this.enter();
  }
}
