import Phaser from 'phaser';
import { VIEW_WIDTH, VIEW_HEIGHT } from './config';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';
import { HouseScene } from './scenes/HouseScene';
import { VillageScene } from './scenes/VillageScene';
import { PuckScene } from './scenes/PuckScene';
import { BitterbalRush } from './scenes/BitterbalRush';
import { ManorGrounds } from './scenes/ManorGrounds';
import { ManorScene } from './scenes/ManorScene';
import { CellarScene } from './scenes/CellarScene';
import { BaliScene } from './scenes/BaliScene';
import { CasaScene } from './scenes/CasaScene';
import { SurfScene } from './scenes/SurfScene';
import { SnowScene } from './scenes/SnowScene';
import { BrasilScene } from './scenes/BrasilScene';
import { PenaltyScene } from './scenes/PenaltyScene';
import { ParatyScene } from './scenes/ParatyScene';
import { GoatMayhem } from './scenes/party/GoatMayhem';
import { SlipperyPanic } from './scenes/party/SlipperyPanic';
import { StrawberryEscape } from './scenes/party/StrawberryEscape';
import { FlightScene } from './scenes/FlightScene';
import { MapScene } from './scenes/MapScene';
import { DEFAULT_LOOK, paintLook, splitSheet, type Look } from './characters/look';
import { loadProfile, saveProfile, type Profile } from './characters/profile';
import { createCharacterAnims } from './entities/Player';
import { Creator } from './ui/creator';
import { Hub } from './ui/hub';

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
    scene: [BootScene, GardenScene, HouseScene, VillageScene, PuckScene, BitterbalRush, ManorGrounds, ManorScene, CellarScene, BaliScene, CasaScene, SurfScene, SnowScene, BrasilScene, PenaltyScene, ParatyScene, GoatMayhem, SlipperyPanic, StrawberryEscape, FlightScene, MapScene],
  });
  (window as unknown as { __game: Phaser.Game }).__game = game; // handy for testing
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
    game.registry.set('playerName', profile?.name ?? '');
    window.focus();
    game.canvas?.focus();
  };

  const openCreator = (fromGame: boolean) => {
    start.hidden = true;
    game.registry.set('started', false);
    creator.open(profile, async (p) => {
      profile = p;
      saveProfile(p);
      game.registry.set('lookKey', await installLook(game, p.look));
      refreshStart();
      play();
    });
    if (fromGame) hud.hidden = true;
  };

  // While typing in a text field, the game must not swallow keys like W, A, S, D, E or space.
  const isField = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
  document.addEventListener('focusin', (e) => { if (isField(e.target)) game.input.keyboard!.enabled = false; });
  document.addEventListener('focusout', (e) => { if (isField(e.target) && !hub.isOpen) game.input.keyboard!.enabled = true; });

  const hub = new Hub();
  const openHub = () => {
    if (!profile || hub.isOpen || !game.registry.get('started')) return;
    game.registry.set('started', false);
    game.input.keyboard!.enabled = false;
    hub.open(profile.name, () => { game.input.keyboard!.enabled = true; play(); });
  };
  $('hub-open').addEventListener('click', openHub);
  game.events.on('open-hub', openHub);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hub.isOpen) hub.close();
  });

  startBtn.addEventListener('click', () => (profile ? play() : openCreator(false)));
  restyle.addEventListener('click', () => openCreator(false));
  game.events.on('open-creator', () => openCreator(true));
  startBtn.focus();
}

startGame();
