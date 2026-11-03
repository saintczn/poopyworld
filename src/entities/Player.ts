import Phaser from 'phaser';
import { WALK_SPEED } from '../config';

export type Facing = 'down' | 'left' | 'right' | 'up';

/** Rows in the LPC character sheets. */
export const FACING_ROW: Record<Facing, number> = { up: 0, left: 1, down: 2, right: 3 };

/** A player character: walking, facing direction and animations. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing = 'down';
  private shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, private look: string) {
    super(scene, x, y, `${look}-idle`, FACING_ROW.down * 3);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Frames are 64x64 with the feet at y=61.
    this.setOrigin(0.5, 61 / 64);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 8);
    body.setOffset(23, 54);
    body.setCollideWorldBounds(true);
    this.shadow = scene.add.image(x, y, 'shadow').setOrigin(0.5, 0.6);
    this.play(`${look}-idle-down`);
  }

  /** dx, dy are -1, 0 or 1. */
  move(dx: number, dy: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const v = new Phaser.Math.Vector2(dx, dy);
    if (v.lengthSq() > 0) v.normalize().scale(WALK_SPEED);
    body.setVelocity(v.x, v.y);

    if (dx !== 0 || dy !== 0) {
      // Prefer the horizontal direction when walking diagonally.
      this.facing = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
      this.play(`${this.look}-walk-${this.facing}`, true);
    } else {
      this.play(`${this.look}-idle-${this.facing}`, true);
    }
  }

  /** Switches to another painted look (after using the character creator). */
  setLook(look: string) {
    this.look = look;
    this.anims.stop();
    this.play(`${look}-idle-${this.facing}`);
  }

  face(dir: Facing) {
    this.facing = dir;
    this.play(`${this.look}-idle-${dir}`, true);
  }

  halt() {
    this.move(0, 0);
  }

  /** The point just in front of the player's feet, used to look at things. */
  lookPoint() {
    const d = 16;
    const off = { down: [0, d], up: [0, -d], left: [-d, 0], right: [d, 0] }[this.facing];
    return { x: this.x + off[0], y: this.y - 4 + off[1] };
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.setDepth(this.y);
    this.shadow.setPosition(Math.round(this.x), Math.round(this.y)).setDepth(this.y - 1);
  }
}

/** Creates walk + idle animations for a character look. */
export function createCharacterAnims(scene: Phaser.Scene, look: string) {
  (Object.keys(FACING_ROW) as Facing[]).forEach((dir) => {
    const row = FACING_ROW[dir];
    scene.anims.create({
      key: `${look}-walk-${dir}`,
      frames: scene.anims.generateFrameNumbers(`${look}-walk`, { start: row * 8, end: row * 8 + 7 }),
      frameRate: 11,
      repeat: -1,
    });
    scene.anims.create({
      key: `${look}-idle-${dir}`,
      frames: scene.anims.generateFrameNumbers(`${look}-idle`, { frames: [row * 3, row * 3 + 1, row * 3 + 2, row * 3 + 1] }),
      frameRate: 3,
      repeat: -1,
    });
  });
}
