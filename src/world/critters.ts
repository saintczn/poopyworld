/**
 * Animals that wander around an area: walk in four directions, now and then stop to graze or peck.
 * Uses LPC farm-animal sheets: rows are up, left, down, right (walk), and the same again for eating.
 */
import Phaser from 'phaser';

export type CritterKind = { sheet: string; frame: number; feetY: number; walkRate: number; eatSheet?: string };

export const GOAT: CritterKind = { sheet: 'goat', frame: 128, feetY: 92, walkRate: 7 };
export const CHICKEN: CritterKind = { sheet: 'chicken-walk', frame: 32, feetY: 28, walkRate: 9, eatSheet: 'chicken-eat' };

const DIRS = ['up', 'left', 'down', 'right'] as const;

/** Registers walk/eat animations for a sheet (call once in the boot scene). */
export function createCritterAnims(scene: Phaser.Scene, key: string, eatKey?: string) {
  DIRS.forEach((dir, row) => {
    scene.anims.create({ key: `${key}-walk-${dir}`, frames: scene.anims.generateFrameNumbers(key, { start: row * 4, end: row * 4 + 3 }), frameRate: 7, repeat: -1 });
    const ek = eatKey ?? key;
    const er = eatKey ? row : row + 4;
    scene.anims.create({
      key: `${key}-eat-${dir}`,
      frames: scene.anims.generateFrameNumbers(ek, { frames: [er * 4, er * 4 + 1, er * 4 + 2, er * 4 + 3, er * 4 + 2, er * 4 + 1] }),
      frameRate: 5, repeat: -1,
    });
    scene.anims.create({ key: `${key}-idle-${dir}`, frames: [{ key, frame: row * 4 }], frameRate: 1 });
  });
}

type Area = { x0: number; x1: number; y0: number; y1: number };

/** Spawns one wandering animal; returns the sprite. */
export function addCritter(scene: Phaser.Scene, kind: CritterKind, sheet: string, area: Area, speed: number) {
  const r = Phaser.Math.RND;
  const s = scene.add.sprite(r.between(area.x0, area.x1), r.between(area.y0, area.y1), sheet, 8)
    .setOrigin(0.5, kind.feetY / kind.frame);
  s.setDepth(s.y);
  let dir: (typeof DIRS)[number] = 'down';
  s.play(`${sheet}-idle-${dir}`);
  const next = () => {
    if (!s.active) return;
    if (r.frac() < 0.45) {
      s.play(`${sheet}-eat-${dir}`);
      scene.time.delayedCall(r.between(2000, 5000), () => { if (s.active) { s.play(`${sheet}-idle-${dir}`); scene.time.delayedCall(r.between(400, 1500), next); } });
      return;
    }
    const tx = r.between(area.x0, area.x1), ty = r.between(area.y0, area.y1);
    const dx = tx - s.x, dy = ty - s.y;
    dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    s.play(`${sheet}-walk-${dir}`);
    scene.tweens.add({
      targets: s, x: tx, y: ty, duration: (Math.hypot(dx, dy) / speed) * 1000,
      onUpdate: () => s.setDepth(s.y),
      onComplete: () => { s.play(`${sheet}-idle-${dir}`); scene.time.delayedCall(r.between(600, 2500), next); },
    });
  };
  scene.time.delayedCall(r.between(200, 2500), next);
  return s;
}
