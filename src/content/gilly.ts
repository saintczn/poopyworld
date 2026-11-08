/**
 * Gilly's ramble system: every visit she strings together a few random topics,
 * loses her thread, and always ends up back at THE FISH.
 */
import type { Look } from '../characters/look';

export const GILLY_LOOK: Look = {
  body: 'f', skin: 'Brown', eyes: 'Brown', hair: 'natural', hairColor: 'Black', beard: 'none',
  shirt: 'longsleeve', shirtColor: 'Coral', legs: 'pants', legsColor: 'Navy', shoes: 'shoes', shoesColor: 'Black',
};

const OPENERS = ['HELLOOO!', 'Ah, daar ben je!', 'Hallo schatje!', 'Kijk eens wie we daar hebben!', 'KALABOKA! ...o nee, jij bent het. Hallo schatje!'];
const TOPICS = [
  'Wil je mijn vissen zien? Ze doen het heel goed vandaag.',
  'Eén van mijn vissen doet een beetje raar. Hij zwemt alleen maar linksom.',
  'Heb je al gegeten? Ik heb M&M\'s. De gele zijn het lekkerst, dat weet iedereen.',
  'Kijk die bloemen eens! Zijn ze niet prachtig?',
  'Die geiten van jullie keken me net heel brutaal aan.',
  'Ik heb een nieuwe vis. Ik weet nog niet hoe hij heet. Misschien Gerrit.',
  'Het wordt vanavond mooi weer, denk ik. Of regen. Een van de twee.',
  'Weet je wat lekker is? M&M\'s in de vriezer. Probeer het maar.',
  'Ik zag Yara vanochtend. Ze vertelde me weer hoe ik mijn tuin moest doen.',
  'Ben zei vandaag "hm". Dat was een goed gesprek.',
  'Yara begon weer te zeuren over mijn tuin, dus ik zei: KALABOKA! Toen was het stil. Heerlijk.',
  'Ik zei tegen de vis: kalaboka. Hij was meteen stil. Goeie vis.',
  'Weet je dat je vriendinnetjes vroeger dachten dat je Kalaboka heette? Ik riep het zo vaak! Hahaha!',
  'Kalaboka betekent "hou je mond" in het Portugees. Maar ik zeg het met liefde. Meestal.',
];
const LOST = ['Wacht, waar was ik?', 'Waar had ik het ook alweer over?', 'Hè, wat wilde ik nou zeggen?', 'Kalaboka, Gilly, je praat te veel! ...dat zeg ik tegen mezelf, hoor.'];
const ENDINGS = ['O ja. DE VISSEN!', 'DE VISSEN! Dat was het!', 'Ach ja, de VISSEN natuurlijk!'];

const pick = <T>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export function gillyRamble(): string[] {
  const pool = [...TOPICS];
  const lines = [`${pick(OPENERS)} ${pool.splice(Math.floor(Math.random() * pool.length), 1)[0]}`];
  for (let i = 0; i < 2; i++) lines.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  lines.push(`${pick(LOST)} ... ${pick(ENDINGS)}`);
  return lines;
}
