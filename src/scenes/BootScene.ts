import Phaser from 'phaser';
import { sheets, sprites } from '../assets';
import { buildHandmade } from '../art/handmade';
import type { Look } from '../characters/look';

/** Loads all graphics, cuts them into named pieces, then opens the garden. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const [key, url] of Object.entries(sheets)) this.load.image(key, url);
  }

  create() {
    // Every named sprite becomes a frame on its sheet: this.add.image(x, y, sheet, name).
    for (const [name, [sheet, x, y, w, h]] of Object.entries(sprites)) {
      this.textures.get(sheet).add(name, 0, x, y, w, h);
    }
    buildHandmade(this);

    const fire = ['fire-0', 'fire-1', 'fire-2', 'fire-3'].map((f) => ({ key: 'campfire', frame: f }));
    this.anims.create({ key: 'fire', frames: fire, frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'wave-ng', frames: this.anims.generateFrameNumbers('flag-ng', { frames: [0, 1] }), frameRate: 3, repeat: -1 });
    this.anims.create({ key: 'wave-nl', frames: this.anims.generateFrameNumbers('flag-nl', { frames: [1, 0] }), frameRate: 3, repeat: -1 });

    const install = this.registry.get('installLook') as (l: Look) => Promise<string>;
    install(this.registry.get('firstLook')).then((key) => {
      this.registry.set('lookKey', key);
      this.scene.start('garden');
    });
  }
}
