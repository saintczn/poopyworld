import Phaser from 'phaser';
import { buildGround, buildObjects, buildPlayer } from '../art/placeholderArt';
import { buildRichPixelArt } from '../art/richPixelArt';

/** Prepares all graphics, then opens the garden. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    buildGround(this);
    buildObjects(this);
    // Replace the temporary geometric art with the cohesive hand-pixeled art set.
    buildRichPixelArt(this);
    // Placeholder look; replaced by the character creator in a later milestone.
    buildPlayer(this, 'player-1', { hair: '#3a2418', shirt: '#2f8f9d', skin: '#d9a07a', pants: '#3d4a6b' });
    this.scene.start('garden');
  }
}
