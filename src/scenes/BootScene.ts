import Phaser from 'phaser';
import { sheets, characterSheets, sprites } from '../assets';
import { buildHandmade } from '../art/handmade';
import { createCharacterAnims } from '../entities/Player';

/** Loads all graphics, cuts them into named pieces, then opens the garden. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const [key, url] of Object.entries(sheets)) this.load.image(key, url);
    this.load.spritesheet('player-walk', characterSheets.playerWalk, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player-idle', characterSheets.playerIdle, { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    // Every named sprite becomes a frame on its sheet: this.add.image(x, y, sheet, name).
    for (const [name, [sheet, x, y, w, h]] of Object.entries(sprites)) {
      this.textures.get(sheet).add(name, 0, x, y, w, h);
    }
    buildHandmade(this);
    createCharacterAnims(this, 'player');

    const fire = ['fire-0', 'fire-1', 'fire-2', 'fire-3'].map((f) => ({ key: 'campfire', frame: f }));
    this.anims.create({ key: 'fire', frames: fire, frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'wave-ng', frames: this.anims.generateFrameNumbers('flag-ng', { frames: [0, 1] }), frameRate: 3, repeat: -1 });
    this.anims.create({ key: 'wave-nl', frames: this.anims.generateFrameNumbers('flag-nl', { frames: [1, 0] }), frameRate: 3, repeat: -1 });

    this.scene.start('garden');
  }
}
