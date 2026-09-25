# Cantina dei vini — ricerca sui vini e decisioni di contenuto

Data della ricerca: 22 settembre 2026. È un brief di lavoro con fonti, non la lista della cantina né un documento approvato dal titolare.

Questo file non ripete la ricerca sul locale: identità, indirizzo, telefono, orari, recensioni, pista sulla partita IVA e contesto di Druento sono in `caveantoineDRUENTO/research/BUSINESS-RESEARCH.md` (31 agosto 2026). Qui si usano solo i dati di quel file, già verificati, e si aggiunge ciò che serve alla galleria: quali vini mostrare, da dove vengono i dati e le foto, cosa resta da confermare.

## Il vincolo di partenza

Non esiste ancora una lista dei vini, una foto delle etichette o una nota di assaggio fornita da Antoine. La galleria quindi **non** presenta i vini come ciò che la Cave tiene in cantina. Mostra vini reali, identificabili e documentati, scelti per affinità con un’enoteca piemontese, con un avviso visibile su ogni vino e in testa alla pagina: «Selezione in aggiornamento, in attesa della lista definitiva del titolare».

## Criterio di scelta

- **Piemonte prima di tutto.** La Cave è un’enoteca a Druento (TO): la carta parte dai classici delle Langhe (Barbaresco, Barolo), dal Roero (Arneis) e dall’Astigiano (Barbera, Moscato).
- **I vini di casa, in provincia di Torino.** Carema (Canavese), Erbaluce di Caluso (Canavese) e Freisa di Chieri (collina torinese). Sono le denominazioni più vicine a Druento e le meno ovvie in una carta generica.
- **Tre bottiglie di Francia.** Il brief indica un possibile legame francese del titolare. Il nome lo suggerisce, ma `BUSINESS-RESEARCH.md` non lo verifica e vieta di usare omonimi francesi. La scelta è quindi di gusto e non va letta come dichiarazione sull’origine di Antoine: un Rodano, un cru del Beaujolais, uno Chablis.
- **Solo produttori con dati pubblici verificabili.** Ogni vino ha una scheda del produttore o, in mancanza, dell’importatore. Nessun vino è entrato per sentito dire.

## I vini

| # | Vino | Produttore | Denominazione | Uve | Zona | Annata della fonte | Dati da | Foto da |
|---|---|---|---|---|---|---|---|---|
| 1 | Barbaresco | Produttori del Barbaresco | Barbaresco DOCG | Nebbiolo 100% | Langhe, Barbaresco (CN) | 2022 | [scheda PDF 2022](https://www.produttoridelbarbaresco.com/wp-content/uploads/barbaresco-docg-2022_produttori-del-barbaresco.pdf) | produttore |
| 2 | Barolo Albe | G.D. Vajra | Barolo DOCG | Nebbiolo 100% | Langhe, Vergne di Barolo (CN) | 2022 | [fact sheet PDF 2022](https://www.gdvajra.it/uploads/public/3616_fact-sheet-2022-barolo-albe-fs-eng.pdf) | produttore |
| 3 | Montebruna | Braida di Giacomo Bologna | Barbera d’Asti DOCG | Barbera 100% | Rocchetta Tanaro (AT) | non indicata | [pagina del vino](https://www.braida.it/montebruna/) | produttore |
| 4 | Blangé | Ceretto | Langhe DOC Arneis | Arneis 100% | Vezza d’Alba, Castellinaldo, Alba | non indicata | [scheda PDF](https://ceretto.com/uploads/public/2030_it-ceretto-langhe-doc-arneis-blange.pdf) | nessuna |
| 5 | Moscato d’Asti | Paolo Saracco | Moscato d’Asti DOCG | Moscato Bianco Canelli | Castiglione Tinella (CN) e dintorni | non indicata | [scheda PDF](https://paolosaracco.it/images/sk/saracco-moscato-en.pdf) | produttore |
| 6 | Carema | Cantina dei Produttori Nebbiolo di Carema | Carema DOC | Nebbiolo 100% | Carema (TO) | 2022 | [scheda 2022](https://www.caremadoc.it/prodotto/carema-doc-2022/) | produttore |
| 7 | La Rustìa | Orsolani | Erbaluce di Caluso DOCG | Erbaluce 100% | San Giorgio Canavese (TO) | non indicata | [scheda importatore PDF](https://static1.squarespace.com/static/681df546e657c13602d27ea8/t/6936ad86f82d611c8b18d06c/1765191046565/Orsolani+La+Rustia+Spec+Sheet.pdf) | nessuna |
| 8 | Surpreisa | Cantine Balbiano | Freisa di Chieri DOC | Freisa 100% | Andezeno (TO) | 2025 | [pagina del vino](https://www.balbiano.com/en/cellars/our-wines/freisa-chieri-doc-surpreisa) | produttore |
| 9 | Côtes du Rhône Rouge | E. Guigal | Côtes du Rhône AOC | Syrah 50, Grenache 40, Mourvèdre 10 | Valle del Rodano | 2020 | [scheda importatore PDF 2020](https://vintus.com/wp-content/uploads/2024/01/Guigal-CDR-Rouge-20-Tech.pdf) | importatore |
| 10 | Morgon | Domaine Marcel Lapierre | Morgon AOC | Gamay 100% | Beaujolais | non indicata | [scheda importatore PDF](https://www.corsowines.com/files/portfolio/Lapierre%20Morgon%20Tech%20Sheet%20.pdf) | produttore |
| 11 | Chablis Champs Royaux | William Fèvre | Chablis AOC | Chardonnay 100% | Chablis, valle del Serein | 2024 | [scheda importatore 2024](https://vintus.com/wines/william-fevre-chablis-champs-royaux/william-fevre-chablis-champs-royaux-2024/) | importatore |

L’elenco completo di dati e fonti per ogni vino è in `data/wines/<id>.json`: ogni dato cita l’id della sua fonte, e la build si ferma se un dato non ne ha una.

## Metodo di verifica

- Ogni dato è stato letto nel **testo grezzo** della fonte (HTML ripulito o testo estratto dal PDF), non in un riassunto. Il 22 settembre 2026 tutti i link di `data/` rispondevano; `williamfevre.com` non risolve e rimanda di fatto a `williamfevre.fr`, che oggi apre la pagina del domaine sul sito del gruppo Lafite.
- **Discrepanze trovate e risolte a favore della fonte più specifica:**
  - Produttori del Barbaresco: la pagina web dice 24 giorni sulle bucce, la scheda PDF 2022 dice 28 giorni e 20 mesi in botte. Riportiamo il PDF, con l’annata accanto.
  - Balbiano: la foto ufficiale ha «2022» nel nome del file, la pagina presenta l’annata 2025. I dati sono quelli del 2025; la didascalia avverte che l’annata in etichetta può differire.
  - Lapierre: la pagina del domaine indica 18 ettari, la scheda dell’importatore 15. Il dato è stato omesso.
- **Non usati di proposito:** premi e punteggi trovati su siti di rivenditori (per esempio i Tre Bicchieri citati per La Rustìa), note di assaggio di produttori, importatori e rivenditori, prezzi. I premi non sono verificati alla fonte, e le note di assaggio in questa pagina spettano ad Antoine.

## Immagini

- **Foto delle bottiglie.** Nove vini su undici hanno una foto ufficiale (packshot) pubblicata dal produttore o dall’importatore. Pagina d’origine, URL dell’immagine e trattamento sono in `product-image-manifest.json`, i byte originali in `src/bottiglie-originali/`. Nessuna fonte ne dichiara la licenza: sono usate per identificare il vino in un’anteprima privata, come il sito generale fa con le foto Google di Marta Ramondetto. **Prima del lancio pubblico vanno autorizzate dai produttori o sostituite con foto delle bottiglie della Cave.**
- **Ceretto e Orsolani** non pubblicano una foto scaricabile (pagine rese via JavaScript o senza packshot). Il sito mostra una sagoma disegnata con «foto in arrivo».
- **Sfondo della volta.** Una sola foto d’atmosfera, Emre Katmer su Unsplash (`free-photo-manifest.json`), dichiarata in pagina come «non è la cantina della Cave».
- **Nessuna etichetta ritoccata, nessuna immagine generata.** L’immagine di condivisione (`assets/images/og.png`) è una grafica tipografica prodotta da `scripts/brand-assets.py`, senza bottiglie reali.

## Prima del lancio pubblico

1. Antoine fornisce la lista reale: si cancellano i vini che non ci sono e si aggiungono i suoi, uno per file in `data/wines/`, con `vintage.inCellar` compilato.
2. Si sostituiscono o si autorizzano le foto delle bottiglie (vedi sopra).
3. Antoine scrive, se vuole, le sue note (`cellarNote`, con autore). Senza, la pagina lo dice.
4. Si decide se e come prenotare (vedi README, «Dal catalogo al negozio») e si compila `commerce` per ogni vino.
5. Valgono anche tutti i punti aperti del sito generale: permessi, ragione sociale, privacy, dominio.
