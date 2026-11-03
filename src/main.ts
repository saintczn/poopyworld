import Phaser from 'phaser';
import { VIEW_WIDTH, VIEW_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';
import { DEFAULT_LOOK, paintLook, splitSheet, type Look } from './characters/look';
import { loadProfile, saveProfile, type Profile } from './characters/profile';
import { createCharacterAnims } from './entities/Player';
import { Creator } from './ui/creator';

const $ = (id: string) => document.getElementById(id)!;
let profile: Profile | null = loadProfile();
let lookCount = 0;

/** Paints a look and registers it with the game as `look<N>`; returns the key. */
async function installLook(game: Phaser.Game, look: Look) {
  const { walk, idle } = splitSheet(await paintLook(look));
  const key = `look${lookCount++}`;
  game.textures.addSpriteSheet(`${key}-walk`, walk as unknown as HTMLImageElement, { frameWidth: 64, frameHeight: 64 });
  game.textures.addSpriteSheet(`${key}-idle`, idle as unknown as HTMLImageElement, { frameWidth: 64, frameHeight: 64 });
  createCharacterAnims(game.scene.getScene('boot'), key);
  return key;
}

async function startGame() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#2d4a2b',
    physics: { default: 'arcade', arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, GardenScene],
  });
  // The boot scene waits for the first look before opening the garden.
  game.registry.set('installLook', (look: Look) => installLook(game, look));
  game.registry.set('firstLook', profile?.look ?? DEFAULT_LOOK);

  const creator = new Creator();
  const start = $('start'), hud = $('hud'), startBtn = $('start-btn'), restyle = $('restyle-btn');
  if (window.matchMedia('(pointer: coarse)').matches) $('mobile-note').hidden = false;

  const showName = () => {
    const tag = $('hud-name');
    tag.textContent = profile?.name ?? '';
    tag.hidden = !profile;
  };

  const refreshStart = () => {
    if (profile) {
      $('start-text').textContent = `Welkom terug, ${profile.name}! De tuin wacht op je.`;
      startBtn.textContent = 'Spelen';
      restyle.hidden = false;
    }
  };
  refreshStart();

  const play = () => {
    start.hidden = true;
    hud.hidden = false;
    showName();
    game.registry.set('started', true);
    window.focus();
    game.canvas?.focus();
  };

  const openCreator = (fromGame: boolean) => {
    start.hidden = true;
    game.registry.set('started', false);
    creator.open(profile, async (p) => {
      profile = p;
      saveProfile(p);
      const key = await installLook(game, p.look);
      (game.scene.getScene('garden') as GardenScene).setPlayerLook(key);
      refreshStart();
      play();
    });
    if (fromGame) hud.hidden = true;
  };

  startBtn.addEventListener('click', () => (profile ? play() : openCreator(false)));
  restyle.addEventListener('click', () => openCreator(false));
  game.events.on('open-creator', () => openCreator(true));
  startBtn.focus();
}

startGame();
