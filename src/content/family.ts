/** Yara and Ben: looks and how they talk. Gilly lives in gilly.ts. */
import type { Look } from '../characters/look';

const pick = <T>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export const YARA_LOOK: Look = {
  body: 'f', skin: 'Peach', eyes: 'Brown', hair: 'curly', hairColor: 'Chestnut', beard: 'none',
  shirt: 'vneck', shirtColor: 'Wine', legs: 'pants', legsColor: 'Black', shoes: 'boots', shoesColor: 'Black',
};

export const BEN_LOOK: Look = {
  body: 'm', skin: 'Porcelain', eyes: 'Blue', hair: 'none', hairColor: 'White', beard: 'full',
  shirt: 'buttoned', shirtColor: 'Denim', legs: 'pants', legsColor: 'Tan', shoes: 'shoes', shoesColor: 'Brown',
};

/** Yara: bossy and confident, with a soft side. */
export function yaraTalk(): string[] {
  const orders = [
    'Die bloemen staan verkeerd. Rood hoort links. Iedereen weet dat.',
    'Jullie brievenbus hangt scheef. Niet tegenspreken, hij hangt scheef.',
    'Als ik jullie was zou ik die geiten eens opvoeden. Ze luisteren naar niemand. Behalve naar mij.',
    'Die kampvuurplek? Prima. Had ik ook zo gedaan. Bijna.',
    'Wie heeft dat pad gelegd? Het is goed. Maar ik had het rechter gedaan.',
  ];
  const soft = [
    'Maar eerlijk? Het is hier echt mooi geworden. Zeg niet dat ik dat zei.',
    'Als je ergens hulp bij nodig hebt, kom je naar mij. Duidelijk?',
    'Ik ben trots op jullie. Zo. Nu ga ik weer kritiek leveren.',
  ];
  return [pick(['Eindelijk, daar ben je.', 'Goed dat je er bent, ik moet je iets vertellen.', 'Luister even.']), pick(orders), pick(soft)];
}

/** Ben: quiet. Mostly "Hm." Now and then one dry line. */
export function benTalk(): string[] {
  if (Math.random() < 0.55) return [pick(['Hm.', 'Hm. (Hij knikt.)', '...Hm.'])];
  return [pick(['Hm.', '...']), pick([
    'Mooi vuurtje.',
    'Die geiten. Die zijn slimmer dan ze eruitzien.',
    'Gilly heeft het weer over de vissen gehad, neem ik aan.',
    'Rustig hier. Goed zo.',
    'Yara heeft gezegd hoe het moet, zeker.',
  ])];
}
