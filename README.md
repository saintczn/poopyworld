# PoopyWorld

Een privé 2D-pixelart-RPG met een eigen Hub, gemaakt voor twee spelers.

## Stand van zaken

| Mijlpaal | Wat | Status |
| --- | --- | --- |
| 1 | Rondlopen in de tuin: lopen, botsingen, camera, dingen bekijken (met echte pixelart), karaktermaker, dag en nacht | Gebouwd en getest in de browser |
| 2 | Inloggen voor twee spelers, elkaar live zien bewegen, stickers | Nog niet begonnen |
| 3 | Villa binnen, Kroki's plekje, Gilly op bezoek | Woonkamer met keuken, Kroki (groen-gele parkiet), en Gilly, Yara en Ben op bezoek gebouwd en getest |
| 4 | Samen inrichten (bouwen en decoreren) | Nog niet begonnen |
| 5 | Stukje wereld richting Heartwood | Nog niet begonnen |
| 6 | Hub v0: dashboard, check-in, vraag van de dag, brieven | Begroeting, check-in, vraag van de dag en geschiedenis gebouwd (lokaal); brieven nog niet |

De pixelart komt uit LPC Revised (gratis te gebruiken met naamsvermelding, zie `CREDITS.md`).
Bij de eerste start maak je je eigen poppetje (naam + uiterlijk); met **C** pas je het later aan.
Het poppetje wordt nu nog alleen in deze browser bewaard; met accounts (mijlpaal 2) gaat het naar de gedeelde opslag.

Pixelart opnieuw klaarzetten: `python3 tools/build_assets.py /pad/naar/LPC` en `python3 tools/build_characters.py /pad/naar/LPC`

## Besturing

- Lopen: WASD of pijltjestoetsen
- Bekijken / verder: E, spatie of Enter
- Tekst sluiten: Esc
- Hub openen: H (of de knop linksboven)
- Poppetje aanpassen: C
- Vissen: E bij de vijver, wachten op beet, E als het streepje in het groen is
- Stickers boven je hoofd: 1 hartje, 2 lachen, 3 kusje, 4 middelvinger, 5 drolletje, 6 muziek

## Techniek

- TypeScript + [Phaser 3](https://phaser.io) voor het spel, gebouwd met Vite.
- Inhoud (wat waar staat, alle teksten) staat los van de code in `src/content/`.

```
npm install
npm run dev           # lokaal spelen
npm run build         # versie voor hosting (map dist/)
npm run build:single  # alles in één HTML-bestand (map dist-single/)
```
