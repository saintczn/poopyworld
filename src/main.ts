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
const touchInteract = document.getElementById('touch-interact')!;
const touchDirections = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-dir]'));
const touchDevice = window.matchMedia('(pointer: coarse)').matches;
touchInteract.hidden = !touchDevice;

function begin() {
  start.hidden = true;
  hud.hidden = false;
  game.registry.set('started', true);
  window.focus();
  game.canvas?.focus();
}
button.addEventListener('click', begin);

const clearTouch = () => {
  for (const direction of ['up', 'down', 'left', 'right']) game.registry.set(`touch-${direction}`, false);
  touchDirections.forEach((el) => el.classList.remove('pressed'));
};
touchDirections.forEach((el) => {
  const direction = el.dataset.dir!;
  el.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    game.registry.set(`touch-${direction}`, true);
    el.classList.add('pressed');
  });
  const release = (event: PointerEvent) => {
    event.preventDefault();
    game.registry.set(`touch-${direction}`, false);
    el.classList.remove('pressed');
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('lostpointercapture', () => {
    game.registry.set(`touch-${direction}`, false);
    el.classList.remove('pressed');
  });
});
window.addEventListener('blur', clearTouch);
touchInteract.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  game.registry.set('touch-interact', true);
});
touchInteract.addEventListener('pointerup', () => game.registry.set('touch-interact', false));
touchInteract.addEventListener('pointercancel', () => game.registry.set('touch-interact', false));
button.focus();
