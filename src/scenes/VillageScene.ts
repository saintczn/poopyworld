import { TILE } from '../config';
import * as V from '../content/heartwood';
import { paintGround } from '../world/ground';
import { WorldScene, type Arrival } from './WorldScene';
import { Ambient, type LightSpot } from '../world/ambient';
import { randomLook } from '../characters/look';
import { rng } from '../world/ground';

const T = TILE;

/** Heartwood Village: the town square, south of the villa garden. */
export class VillageScene extends WorldScene {
  private ambient!: Ambient;

  constructor() {
    super('village');
  }

  protected build(): Arrival {
    const W = V.MAP_W * T, H = V.MAP_H * T;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H).setBackgroundColor('#2d4a2b');
    paintGround(this, 'village-ground', { w: V.MAP_W, h: V.MAP_H, dirt: V.dirt, seed: 5 });
    this.add.image(0, 0, 'village-ground').setOrigin(0).setDepth(-1000);

    const lights: LightSpot[] = [];
    for (const b of V.buildings) this.addBuilding(b, lights);

    // fountain
    const f = { x: V.fountain.x * T, y: V.fountain.y * T };
    this.add.image(f.x, f.y, 'fountain').setOrigin(0.5, 1).setDepth(f.y - 18);
    this.solid(f.x - 30, f.y - 44, 60, 26);
    this.interactables.push({ id: 'fountain', at: { x: f.x, y: f.y - 8 }, who: 'Fontein', lines: ['De fontein klatert vrolijk.', 'Je zou een muntje willen gooien, maar je hebt nog geen muntjes. Straks wel!'] });
    lights.push({ x: f.x, y: f.y - 40, size: 140, colour: 0x9be3ff });

    for (const p of V.props) {
      const img = this.place(p.key, p.x * T, p.y * T, p.solid);
      if (p.z) img.setDepth(p.z);
      if (p.key === 'lamp') lights.push({ x: p.x * T, y: p.y * T - 68, size: 170 });
    }
    for (const [key, x, y] of V.trees) {
      const pine = key.startsWith('pine');
      this.add.image(x * T, y * T - 4, 'trees', pine ? 'shadow-pine' : 'shadow-tree').setAlpha(0.3).setDepth(-400);
      this.place(key, x * T, y * T, [22, 10]);
    }
    for (const [key, x, y] of V.flowers) this.place(key, x * T, y * T);

    // market stall talk and notice board
    this.interactables.push(
      { id: 'market', at: { x: 15.2 * T, y: 15.4 * T }, who: 'Marktkraam', lines: ['Manden met appels, peren en kool.', 'Op een bordje staat: "Vandaag geen aardbeien. Morgen ook niet. Nooit eigenlijk."'] },
      { id: 'board', at: { x: V.noticeBoard.x * T, y: V.noticeBoard.y * T + 6 }, who: 'Prikbord', lines: ['GEZOCHT: wie heeft de geit van het dak van Lotte gehaald?', 'BINNENKORT: PUCK gaat open! Toernooi elke vrijdag.', 'TE KOOP: bitterballen. Vraag naar Bram in Bali.'] },
    );
    this.place('sign', V.noticeBoard.x * T, V.noticeBoard.y * T, [10, 6]).setScale(1.3);

    // edges
    this.solid(0, 0, 19.6 * T, 2.6 * T);
    this.solid(24.4 * T, 0, W, 2.6 * T);
    this.solid(0, 0, 1.8 * T, H);
    this.solid(W - 1.6 * T, 0, 1.6 * T, H);
    this.solid(0, H - 2.4 * T, W, 2.4 * T);

    // villagers
    const r = rng(42);
    const spots = [
      { x: 14 * T, y: 12 * T }, { x: 30 * T, y: 12.6 * T }, { x: 18 * T, y: 17 * T }, { x: 26 * T, y: 16.6 * T },
      { x: 22 * T, y: 11.2 * T }, { x: 11.5 * T, y: 21 * T }, { x: 32.5 * T, y: 21 * T }, { x: 8 * T, y: 25.4 * T },
      { x: 20 * T, y: 25.6 * T }, { x: 36 * T, y: 25.2 * T }, { x: 22 * T, y: 6 * T },
    ];
    V.villagers.forEach((v, i) => {
      const mine = [spots[i % spots.length], spots[(i + 3) % spots.length], spots[(i + 6) % spots.length]];
      this.addVisitor(v.name, randomLook(r), mine, () => v.lines, 20 + (i % 3) * 3);
    });

    this.ambient = new Ambient(this, { w: W, h: H }, lights, V.flowers.filter(([k]) => k.startsWith('flowers')).map(([, x, y]) => ({ x: x * T, y: y * T })));
    return { x: 22 * T, y: 3.4 * T, facing: 'down' };
  }

  private addBuilding(b: V.Building, lights: LightSpot[]) {
    const img = this.add.image(b.x, b.y, b.sprite).setOrigin(0);
    img.setDepth(b.y + img.height - 30);
    for (const [x, y, w, h] of b.walls) this.solid(b.x + x, b.y + y, w, h);
    for (const [x, y] of b.windows) lights.push({ x: b.x + x, y: b.y + y, size: 90 });
    this.interactables.push({ id: b.id, at: b.door, who: b.who, lines: b.lines });

    // hanging sign above the door
    const signY = b.sprite.startsWith('cottage') ? b.y + 64 : b.sprite === 'house-b' ? b.y + 122 : b.y + 112;
    const text = this.add.text(b.door.x, signY, b.sign, {
      fontFamily: '"Pixelify Sans", "Courier New", monospace', fontSize: '12px', color: b.signColour,
      stroke: '#2a1a14', strokeThickness: 3,
    }).setOrigin(0.5).setResolution(2);
    const pad = 6, w = Math.ceil(text.width) + pad * 2, h = 18;
    const g = this.add.graphics();
    g.fillStyle(0x2a1a14); g.fillRect(b.door.x - w / 2 - 2, signY - h / 2 - 2, w + 4, h + 4);
    g.fillStyle(0x8a5a34); g.fillRect(b.door.x - w / 2, signY - h / 2, w, h);
    g.fillStyle(0xb07a48); g.fillRect(b.door.x - w / 2, signY - h / 2, w, 2);
    g.fillStyle(0x5e3a20); g.fillRect(b.door.x - w / 2, signY + h / 2 - 2, w, 2);
    const depth = img.depth + 1;
    g.setDepth(depth); text.setDepth(depth + 1);
    if (b.id === 'puck') lights.push({ x: b.door.x, y: signY, size: 120, colour: 0xff5fd2, flicker: true, always: 0.25 });
  }

  protected tick(time: number) {
    this.ambient.update(time);
    const p = this.player;
    if (p && this.registry.get('started') && p.y < 2.0 * T && p.x > 19.6 * T && p.x < 24.4 * T) {
      this.travel('garden', { x: 544, y: 760, facing: 'up' });
    }
  }
}
