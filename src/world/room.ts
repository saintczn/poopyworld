/** Paints a simple indoor room (floor, back wall, wall tops) and its walls. Used by small interiors. */
import Phaser from 'phaser';

export type RoomSpec = {
  key: string;
  map: { w: number; h: number };
  room: { x: number; y: number; w: number; h: number };
  wallTop: number;
  door: { x: number; w: number };
  floorCol: number;       // column in Wood Floor A (0 dark ... 4 light)
  wallBlock: number;      // x of the 3-tile wall block in Painted Walls
  band: [number, number, number]; // wall-top colours: base, light, shadow
};

export function paintRoom(scene: Phaser.Scene, s: RoomSpec) {
  const floor = scene.textures.get('floorwood').getSourceImage() as HTMLImageElement;
  const walls = scene.textures.get('walls').getSourceImage() as HTMLImageElement;
  if (!scene.textures.exists(s.key)) {
    const tex = scene.textures.createCanvas(s.key, s.map.w, s.map.h)!;
    const c = tex.getContext();
    c.imageSmoothingEnabled = false;
    const rnd = new Phaser.Math.RandomDataGenerator([s.key]);
    const R = s.room;
    for (let y = R.y; y < R.y + R.h; y += 32) for (let x = R.x; x < R.x + R.w; x += 32) {
      c.drawImage(floor, s.floorCol * 32, rnd.pick([0, 0, 1, 2]) * 32, 32, 32, x, y, 32, 32);
    }
    for (let x = s.door.x - s.door.w / 2; x < s.door.x + s.door.w / 2; x += 32) c.drawImage(floor, s.floorCol * 32, 0, 32, 16, x, R.y + R.h, 32, 16);
    for (let x = R.x; x < R.x + R.w; x += 32) {
      const sx = s.wallBlock + (x === R.x ? 0 : x === R.x + R.w - 32 ? 64 : 32);
      c.drawImage(walls, sx, 0, 32, 96, x, s.wallTop, 32, 96);
    }
    const grad = c.createLinearGradient(0, R.y, 0, R.y + 14);
    grad.addColorStop(0, 'rgba(20,10,20,0.4)');
    grad.addColorStop(1, 'rgba(20,10,20,0)');
    c.fillStyle = grad;
    c.fillRect(R.x, R.y, R.w, 14);
    // door mat
    c.fillStyle = '#2a1a2a'; c.fillRect(s.door.x - 26, R.y + R.h - 22, 52, 20);
    c.fillStyle = '#6a2a6a'; c.fillRect(s.door.x - 24, R.y + R.h - 20, 48, 16);
    c.fillStyle = '#b04ab0'; c.fillRect(s.door.x - 20, R.y + R.h - 17, 40, 10);
    tex.refresh();
  }
  scene.add.image(0, 0, s.key).setOrigin(0).setDepth(-1000);
}

export function roomWalls(scene: Phaser.Scene, s: RoomSpec, solid: (x: number, y: number, w: number, h: number) => unknown) {
  const g = scene.add.graphics().setDepth(5000);
  const [base, light, shade] = s.band;
  const band = (x: number, y: number, w: number, h: number) => {
    g.fillStyle(0x1a1018); g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle(base); g.fillRect(x, y, w, h);
    g.fillStyle(light); g.fillRect(x, y, w, 2);
    g.fillStyle(shade); g.fillRect(x, y + h - 2, w, 2);
  };
  const R = s.room, L = R.x - 16, Rt = R.x + R.w, B = R.y + R.h, D = s.door;
  band(L, s.wallTop - 16, R.w + 32, 16);
  band(L, s.wallTop - 16, 16, B + 16 - (s.wallTop - 16));
  band(Rt, s.wallTop - 16, 16, B + 16 - (s.wallTop - 16));
  band(L, B, D.x - D.w / 2 - L, 16);
  band(D.x + D.w / 2, B, Rt + 16 - (D.x + D.w / 2), 16);
  solid(0, 0, s.map.w, R.y + 8);
  solid(0, 0, R.x + 4, s.map.h);
  solid(R.x + R.w - 4, 0, s.map.w, s.map.h);
  solid(0, B + 2, D.x - D.w / 2 + 6, s.map.h);
  solid(D.x + D.w / 2 - 6, B + 2, s.map.w, s.map.h);
}
