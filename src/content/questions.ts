/** Questions for the "vraag van de dag". Mostly light and silly, some sweet, some deep. */
export const QUESTIONS: string[] = [
  'Welk moment met mij laat je altijd glimlachen?',
  'Als we morgen ergens heen konden vliegen, waar zou dat zijn?',
  'Wat doe ik waar je stiekem om moet lachen?',
  'Hoe ziet ons droomhuis eruit?',
  'In welke film- of gamewereld zou je met mij willen wonen?',
  'Wat is iets nieuws dat je samen met mij wilt proberen?',
  'Als je één dag een dier mocht zijn, welk dier en waarom?',
  'Wat is het lekkerste dat je ooit hebt gegeten?',
  'Welk liedje moet er altijd op ons feestje gedraaid worden?',
  'Wat was je eerste indruk van mij? Eerlijk zijn.',
  'Bitterballen of kroketten? Dit is een serieuze vraag.',
  'Wat is je favoriete herinnering aan Bali?',
  'Als we een geit kregen, hoe zou hij heten?',
  'Wat zou je doen met een volledig vrije dag zonder telefoon?',
  'Welke superkracht zou je willen hebben, maar dan een nutteloze?',
  'Wat is iets kleins dat ik doe waardoor je je fijn voelt?',
  'Waar zie je ons over vijf jaar?',
  'Wat is de raarste droom die je je kunt herinneren?',
  'Welk spel bij PUCK moeten we zeker nog eens spelen?',
  'Wat is je guilty pleasure tv-programma?',
  'Als je mij één compliment mocht geven dat je nog nooit gaf, welk is het?',
  'Welk eten zou je nooit meer willen eten? (Aardbeien tellen niet, dat weten we al.)',
  'Wat is iets waar je trots op bent van het afgelopen jaar?',
  'Als we samen een restaurant begonnen, wat zou er op de kaart staan?',
  'Wat is je lievelingsgeur?',
  'Welk dier lijkt het meest op mij, qua karakter?',
  'Wat wil je absoluut nog een keer met mij doen?',
  'Welke rare gewoonte heb jij die niemand weet?',
  'Ochtendmens of avondmens, en waarom heb je ongelijk als je ochtendmens zegt?',
  'Als je terug kon naar één dag van onze relatie, welke dag?',
];

/** The same question for everyone on the same day. */
export function questionOfTheDay(date = new Date()) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);
  return QUESTIONS[day % QUESTIONS.length];
}

export const MOODS: Array<[string, string]> = [
  ['blij', '#f6c83a'], ['opgewonden', '#ff8a3d'], ['relaxed', '#7ec8a0'], ['moe', '#9aa5b8'], ['gestrest', '#e86a5a'],
  ['verdrietig', '#6a8fd8'], ['gek', '#c77ddb'], ['romantisch', '#ef6f9a'], ['dankbaar', '#5aa83f'], ['neutraal', '#c9bfa6'],
];
