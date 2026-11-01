import Phaser from 'phaser';
import { WALK_SPEED } from '../config';

export type Facing = 'down' | 'left' | 'right' | 'up';

/** A player character: walking, facing direction and animations. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing = 'down';
  private shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, private texKey: string) {
    super(scene, x, y, texKey, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    // Small collision box at the feet, like classic top-down RPGs.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 6);
    body.setOffset(3, 18);
    body.setCollideWorldBounds(true);
    this.shadow = scene.add.image(x, y, 'shadow').setOrigin(0.5, 0.75);
    this.play(`${texKey}-idle-down`);
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
      this.play(`${this.texKey}-walk-${this.facing}`, true);
    } else {
      this.play(`${this.texKey}-idle-${this.facing}`, true);
    }
  }

  halt() {
    this.move(0, 0);
  }

  /** The point just in front of the player's feet, used to look at things. */
  lookPoint() {
    const d = 10;
    const off = { down: [0, d], up: [0, -d], left: [-d, 0], right: [d, 0] }[this.facing];
    return { x: this.x + off[0], y: this.y - 3 + off[1] };
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.setDepth(this.y);
    this.shadow.setPosition(Math.round(this.x), Math.round(this.y)).setDepth(this.y - 1);
  }
}
