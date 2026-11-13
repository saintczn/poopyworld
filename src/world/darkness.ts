/**
 * Darkness over a scene, with soft holes of light (your lantern, torches, moonlight).
 * Call update(lights) every frame with world positions and a size (1 = the size of your lantern).
 */
import Phaser from 'phaser';
import { VIEW_WIDTH as W, VIEW_HEIGHT as H } from '../config';

export type Hole = { x: number; y: number; size?: number };

export class Darkness {
  private rt: Phaser.GameObjects.RenderTexture;
  private stamp: Phaser.GameObjects.Image;

  constructor(private scene: Phaser.Scene, private alpha = 0.93, depth = 95000) {
    this.rt = scene.add.renderTexture(0, 0, W, H).setOrigin(0).setScrollFactor(0).setDepth(depth);
    this.stamp = scene.make.image({ key: 'glow', add: false });
  }

  update(holes: Hole[]) {
    const cam = this.scene.cameras.main;
    this.rt.clear();
    this.rt.fill(0x000000, this.alpha);
    for (const h of holes) {
      this.stamp.setScale(2.1 * (h.size ?? 1));
      this.rt.erase(this.stamp, h.x - cam.scrollX, h.y - cam.scrollY);
    }
  }
}
