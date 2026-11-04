/**
 * The Secret of Hollowmere Manor (an original mystery, inspired by the mood of House of Anubis).
 * Chapter 1: "De Brief". Progress is saved in this browser.
 */
export type MysterySave = { letter: boolean; plateHint: boolean; shelfOpen: boolean; seal1: boolean; pages: number[] };

const K = 'poopyworld.mystery.v1';
export function loadMystery(): MysterySave {
  try { return { letter: false, plateHint: false, shelfOpen: false, seal1: false, pages: [], ...JSON.parse(localStorage.getItem(K) ?? '{}') }; }
  catch { return { letter: false, plateHint: false, shelfOpen: false, seal1: false, pages: [] }; }
}
export function saveMystery(m: MysterySave) {
  try { localStorage.setItem(K, JSON.stringify(m)); } catch { /* fine */ }
}

export const LETTER = [
  'Er zit een brief in de brievenbus. Het papier is vergeeld en ruikt naar kaarsvet.',
  '"Aan de twee bewoners van het huis bij het meer. Het is lang geleden dat hier iemand woonde die zo goed voor zijn dieren zorgt."',
  '"Ik heb jullie hulp nodig. Kom naar mijn huis op de heuvel, voorbij Heartwood. Het pad begint aan het eind van de onderste straat."',
  '"P.S. Neem elkaar mee. Sommige deuren gaan alleen open voor twee." — O. H.',
];

export const PAGES = [
  {
    who: 'Dagboek, pagina 1',
    lines: ['"3 maart 1925. Vannacht zag ik weer het licht boven de heuvel. Geen ster die ik ken."', '"Het knippert, alsof het iets wil zeggen. Ik ga het uitzoeken, wat de anderen ook zeggen." — Odile Hollow'],
  },
  {
    who: 'Dagboek, pagina 2',
    lines: ['"12 maart. De Lantaarnkring zegt dat ik moet stoppen met zoeken. Waarom zijn ze zo bang?"', '"Ik heb het eerste zegel verstopt waar alleen een sterrenkijker zou zoeken."'],
  },
];

export const SEAL_FOUND = [
  'Achter de boekenkast ligt een stenen zegel: een wolf onder een ster. Het voelt warm aan.',
  'Ernaast ligt een briefje: "Dit is de eerste van vier. Breng ze naar het licht. Vertrouw de Lantaarnkring niet." — O. H.',
];
