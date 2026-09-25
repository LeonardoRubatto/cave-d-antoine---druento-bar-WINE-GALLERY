# Crediti di design e fonti

Adattati dalla libreria Design Memory dell’utente; il repository della libreria non è stato modificato.

"Mask Reveal Up" by codse (animata), MIT.
https://github.com/codse/animata/blob/main/animata/text/mask-reveal-up.tsx

Usato solo per il titolo della volta: rivelazione per riga una volta sola, testo già nel markup, 24px di corsa e 60ms di sfalsamento, gestione del movimento ridotto. Nessun ciclo.

"Text Highlighter" by Daniel Petho (Fancy Components), MIT.
https://fancycomponents.dev/r/text-highlighter.json

Usato una sola volta, su «cantina.». Riga color vino sotto testo avorio, attivazione una tantum, stato statico con movimento ridotto. Il testo resta selezionabile.

"Parallax Floating" by Daniel Petho (Fancy Components), MIT.
https://fancycomponents.dev/r/parallax-floating.json

Presa solo l’idea del rientro morbido verso il puntatore, per la foto di fondo della volta. Nessun codice copiato. A differenza dell’originale, il ciclo di frame si ferma quando nulla si muove, gira solo con la volta visibile, ed è disattivato sotto i 768px e con movimento ridotto.

"Smooth Flexbox Filtering with Flip" by GreenSock (CodePen), license unconfirmed. https://codepen.io/GreenSock/pen/NWRxarv

Solo riferimento visivo e concettuale. Nessun codice della pen copiato e nessun GSAP. La tecnica FLIP del filtro della carta (misura, cambia il DOM, anima dalla vecchia posizione) è scritta da zero in `assets/js/main.js` con Web Animations API, su radio nativi, con movimento ridotto.

"ScrollTrigger Image Zoom" by GreenSock (CodePen), license unconfirmed. https://codepen.io/GreenSock/pen/YzbPYMx

Solo riferimento visivo. Nessun codice copiato. Lo zoom 1,06→1 della foto nella volta è la stessa implementazione nativa del sito generale, senza pin, marker né GSAP.

La lanterna (luce che segue puntatore, tocco e focus, bottiglie che si accendono con la distanza) è un’implementazione originale di questo progetto.

## Foto delle bottiglie

Immagini ufficiali pubblicate da produttori e importatori. Pagina di origine, URL, trattamento e stato per ciascuna in `research/product-image-manifest.json`; byte originali in `src/bottiglie-originali/`.

- Barbaresco: Produttori del Barbaresco. https://www.produttoridelbarbaresco.com/vini/barbaresco-docg/
- Barolo Albe: G.D. Vajra. https://www.gdvajra.it/en/barolo-albe-docg
- Montebruna: Braida. https://www.braida.it/area-download/
- Moscato d’Asti: Paolo Saracco. https://paolosaracco.it/en/wines-saracco-piedmont/moscato-d-asti-docg-saracco
- Carema: Cantina dei Produttori Nebbiolo di Carema. https://www.caremadoc.it/prodotto/carema-doc-2022/
- Surpreisa: Cantine Balbiano. https://www.balbiano.com/en/cellars/our-wines/freisa-chieri-doc-surpreisa
- Côtes du Rhône Rouge (E. Guigal): Vintus, importatore statunitense. https://vintus.com/wines/cotes-du-rhone-rouge/
- Morgon: Domaine Marcel Lapierre. https://www.marcel-lapierre.com/en/product/morgon/
- Chablis Champs Royaux (William Fèvre): Vintus, importatore statunitense. https://vintus.com/wines/william-fevre-chablis-champs-royaux/william-fevre-chablis-champs-royaux-2024/

L’attribuzione non è una licenza: nessuna fonte dichiara i termini d’uso. Queste foto valgono per un’anteprima privata finché i permessi non sono stabiliti con i produttori, oppure finché non vengono sostituite con foto delle bottiglie della Cave. Trattamento: solo ritaglio. Per Braida e Saracco il fondo bianco collegato ai bordi è stato reso trasparente, per Lapierre è stata isolata una bottiglia da una foto di gruppo ed escluso il riflesso a terra. Etichette mai ritoccate. Ceretto (Blangé) e Orsolani (La Rustìa): nessuna foto ufficiale scaricabile, il sito mostra una sagoma disegnata.

## Foto di sfondo

Emre Katmer, “a bunch of bottles of wine are stacked on a shelf”, pubblicata il 16 gennaio 2022.
https://unsplash.com/photos/a-bunch-of-bottles-of-wine-are-stacked-on-a-shelf-LaLp0Jzl4_0
Uso commerciale libero secondo la Licenza Unsplash: https://unsplash.com/license (verificata il 22 settembre 2026). File locale: `src/photos/bottiglie.jpg`, varianti in `assets/images/foto/`. Nessun ritocco, solo ridimensionamento. È un’immagine d’atmosfera: non la cantina della Cave né i vini descritti.

## Caratteri, icone, immagine di condivisione

Cormorant Garamond e DM Sans (SIL Open Font License), gli stessi file del sito generale, incorporati come data URL in `assets/css/fonts.css`: nessuna richiesta esterna. Favicon condivise con il sito generale; `favicon.ico` generato dal PNG 32px. Nessuna icona: le azioni sono testo.

Immagine di condivisione (`assets/images/og.png`): grafica tipografica generata da `scripts/brand-assets.py` con i token del marchio. Nessuna foto e nessuna bottiglia reale.

## Dati dei vini

Fonte e data di consultazione per ogni dato: `data/wines/<id>.json`, riportate in fondo a ogni scheda. Metodo e discrepanze: `research/WINE-RESEARCH.md`.
