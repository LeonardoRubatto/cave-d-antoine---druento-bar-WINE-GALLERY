# Piano di design — Cantina dei vini (revisione 2)

Revisione dopo la critica del committente: la v1 clonava l'impaginazione del sito fratello (insegna, menu, footer vino, paesaggio) e usava tic da AI (card sospese, pillole, pulsanti con freccia, trittico, occhielli ripetuti, callout ovunque). Del fratello restano solo i token.

## Intent
Una carta dei vini sfogliabile per la Cave d’Antoine: le bottiglie vere dei produttori, divise per zona come su uno scaffale. Per i clienti del bancone di Druento. Vetrina, non negozio.

## Layout
Header a una riga (marchio a sinistra, tre voci di testo a destra, niente menu a tendina). Volta buia a tutta larghezza: titolo in alto a sinistra, mensola con nove bottiglie in fila in basso, illuminate da una lanterna. Poi la carta su carta avorio: colonna sinistra 3/12 con il nome della zona (sticky), colonna destra 9/12 con le bottiglie in piedi su una linea di mensola e le didascalie sotto. Scheda vino: bottiglia nella volta a sinistra (5/12), carta dei dati a destra (7/12). Colophon sobrio al posto del footer.

## Type
Cormorant Garamond per nomi dei vini, zone e titoli (500/600, corsivo per le denominazioni); DM Sans per didascalie e dati (400/500). Scala 1.25 del marchio: 12/14/16/20/25/31/39/49/61/76, più 95 solo per il titolo della volta (passo successivo della stessa scala). Maiuscolette spaziate +.08em solo per le etichette di sezione dentro la carta.

## Color
Token del marchio (avorio #f6f3ea, vino #6f272f, oliva #59604a, testo #302a25, evidenziatore #e4c780) più la scala cantina generata con generate-color-scale.mjs --hue 17 --chroma 0.05 --mode dark (#180b0c, #2a1a1b, #412d2d, #c9b1b1). La luce della lanterna è l'evidenziatore. Nessuna tinta nuova.

## Motion
cubic-bezier(.22,1,.36,1). 250ms bottiglia che si solleva dallo scaffale (8px), 400ms riordino dei filtri (FLIP), 600ms reveal del solo titolo della volta, 800ms accensione della lanterna (una volta, non blocca nulla). prefers-reduced-motion: luce piena e ferma, niente riordino animato, niente reveal.

## Items
text-effects/mask-reveal-up
text-effects/text-highlighter
transitions/flexbox-filter-flip (reference: solo la tecnica FLIP, implementazione originale)
scroll/scrolltrigger-image-zoom (reference: zoom 1.06→1 della foto nella volta, implementazione nativa)
image-treatment/parallax-floating (Fancy Components, MIT: solo l’idea del rientro morbido verso il puntatore per la foto di fondo)
