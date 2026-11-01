import Phaser from 'phaser';
import { VIEW_WIDTH, VIEW_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1b2a24',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, GardenScene],
});

// Start screen: the garden is already visible behind it; "Spelen" gives control to the player.
const start = document.getElementById('start')!;
const hud = document.getElementById('hud')!;
const button = document.getElementById('start-btn')!;
if (window.matchMedia('(pointer: coarse)').matches) document.getElementById('mobile-note')!.hidden = false;

function begin() {
  start.hidden = true;
  hud.hidden = false;
  game.registry.set('started', true);
  window.focus();
  game.canvas?.focus();
}
button.addEventListener('click', begin);
button.focus();
