# Cantina dei vini — La Cave d’Antoine, Druento

La carta dei vini della Cave d’Antoine: una vetrina che cresce man mano che arrivano le bottiglie. **Non è un negozio**: niente carrello, niente pagamento, niente prezzi. È un sito a sé, fratello del sito generale ([caveantoine.pages.dev](https://caveantoine.pages.dev), sorgente in `../caveantoineDRUENTO`): stesso marchio, cartella e impaginazione proprie.

Sito statico, senza framework e senza server: HTML, CSS e JavaScript classico. Si apre con un doppio clic su `index.html` (funziona da `file://`, anche offline) oppure si carica la cartella intera su qualsiasi hosting statico (Cloudflare Pages, Netlify, GitHub Pages).

## Struttura

```
index.html              La volta (bottiglie sulla mensola) e la carta per scaffali
vini/<id>.html          Una scheda per vino, tutte dallo stesso template
note-legali.html        Chi pubblica, ogni fatto non verificato, privacy, crediti
404.html                Pagina non trovata (noindex)
sitemap.xml, robots.txt
favicon.ico
assets/
  css/style.css         Tutto lo stile (a mano)
  css/fonts.css         Generato: Cormorant Garamond e DM Sans come data URL
  js/main.js            Lanterna, filtro della carta, reveal, profondità (vanilla)
  images/bottiglie/     Foto ufficiali delle bottiglie, AVIF+WebP, 400/800/1200 px d’altezza
  images/foto/          Foto di sfondo, AVIF+WebP, 640/960/1536 px
  images/og.png, favicon*
data/
  site.json             Configurazione unica: dominio, link al sito generale,
                        dati del locale, modalità commerce, tipologie, zone
  wines/<id>.json       UNA SCHEDA PER VINO: la fonte di verità
  images.json, bottles.json   Generati dagli script immagini
scripts/                Strumenti di authoring (non servono al sito pubblicato)
  build.mjs             Node, zero dipendenze: valida i dati e scrive le pagine
  images.py, bottles.py Pillow: varianti responsive (rules/images.md)
  brand-assets.py       og.png e favicon.ico
src/                    Originali delle immagini (byte intatti)
research/               WINE-RESEARCH.md, DESIGN-SYSTEM-MAP.md, design-plan.md,
                        free-photo-manifest.json, product-image-manifest.json
CREDITS.md              Attribuzioni di componenti, foto e caratteri
```

Le pagine HTML sono **generate ma consegnate**: la build gira sul computer di chi modifica i contenuti, il sito pubblicato è fatto solo dei file in cartella. Tutti i percorsi interni sono relativi.

## Aggiungere o cambiare un vino

1. Copia un file in `data/wines/` e rinominalo con l’id del vino (minuscole e trattini).
2. Compila i campi. Ogni dato in `facts` deve citare una fonte in `sources`, e ogni fonte deve avere URL e data di consultazione: altrimenti la build si ferma e dice perché.
3. Se c’è una foto della bottiglia, mettila in `src/bottiglie-originali/`, aggiungi la riga in `scripts/bottles.py` e lancia `python scripts/bottles.py`. Senza foto il sito mostra una sagoma con «foto in arrivo».
4. `node scripts/build.mjs`

Per provare in locale i link verso il sito generale (cartella fratella invece del sito pubblicato): `node scripts/build.mjs --sibling=local`. Prima di pubblicare, ricostruisci senza l’opzione.

## Prima di pubblicare

1. **Imposta il dominio vero.** In `data/site.json` cambia `baseUrl` (oggi `https://your-gallery-domain.example/`, segnaposto IANA) e rilancia `node scripts/build.mjs`. Canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD, `sitemap.xml` e `robots.txt` si aggiornano insieme. Finché resta il segnaposto, ogni pagina ha un commento `TODO` in testa al `<head>` e la build lo ricorda.
2. **Sostituisci la selezione di prova con la lista del titolare.** Gli 11 vini attuali sono reali e documentati, ma non sono confermati in cantina: vedi `research/WINE-RESEARCH.md`. Con la lista vera si possono togliere gli avvisi «Selezione in aggiornamento» (testo in `site.json`, `placeholderNotice`, più le righe in `scripts/build.mjs`).
3. **Autorizza o sostituisci le foto delle bottiglie.** Sono le foto ufficiali di produttori e importatori, senza licenza dichiarata, usate per l’anteprima privata: vedi `research/product-image-manifest.json` e `CREDITS.md`.
4. **Conferma i dati legali** elencati in `note-legali.html` (ragione sociale, partita IVA, email, titolare del trattamento, hosting) e i permessi già aperti per il sito generale.
5. **Collega i due siti.** Questo sito punta già al sito generale («La Cave» nella barra, «Il sito della Cave» nel colophon). Il sito generale oggi ha la voce «Cantina dei vini» solo nella versione locale, e punta a `../caveantoineDRUENTO%20VIN%20GALLERY/index.html`, cioè a un’altra cartella. Va aggiornata con l’indirizzo pubblico di questa galleria e ripubblicata: la versione online non ha ancora il link.
6. Registra il dominio su Google Search Console e Bing Webmaster Tools con un file di verifica **proprio** di questo sito (non quello del sito generale).

## Dal catalogo al negozio, senza rifare il sito

Oggi il sito è in modalità `info`: ogni scheda ha uno slot «Disponibilità» che dice «da confermare» e invita a chiamare. Il modello dati e il template sono già pensati per le fasi successive:

- **Ogni vino ha il suo file e il suo URL stabile** (`vini/<id>.html`): è la pagina prodotto di domani.
- **Ogni scheda ha già un blocco `commerce`**: `sku`, `price`, `availability`, `providerRef`. Oggi sono vuoti.
- **Ogni pagina ha già uno slot marcato**: `<section class="wine-commerce" data-commerce-slot data-mode data-wine-id data-sku>`. Tutto ciò che riguarda l’acquisto passa da una sola funzione, `renderCommerce()` in `scripts/build.mjs`.

Le fasi, in ordine:

1. **Contatto per prenotare** (già implementato, basta attivarlo). In `site.json` metti `commerce.mode` a `"contact"` e, se vuoi, `contact.email` / `contact.whatsapp`. Per i vini con `availability: "disponibile"` lo slot diventa «Tienila da parte» con il telefono e un messaggio precompilato; gli altri restano «da confermare». Il prezzo appare solo se `price` è compilato.
2. **Shopify Buy Button, Snipcart o Commerce Layer.** La build conosce già questi nomi di modalità e oggi **si ferma con un errore** se li trova: nessun carrello finto. Per collegarne uno:
   - aggiungi il suo caso in `renderCommerce()`, usando `sku` o `providerRef` del vino;
   - includi lo script del fornitore solo nelle pagine vino;
   - aggiorna la privacy in `note-legali.html` (cookie, pagamento, dati personali);
   - aggiungi `Product` + `Offer` al JSON-LD delle schede.
   
   Riferimenti: per Snipcart l’attributo `data-item-id` corrisponde a `sku`, per Shopify l’id prodotto va in `providerRef`.
3. Nota: un carrello richiede un servizio esterno. Il sito resta statico, ma a quel punto la modalità `file://` non basta più per comprare. `rules/architecture.md` chiede di dichiarare questa eccezione quando la si introduce.

## Controlli fatti

- **Build:**
  - `node scripts/build.mjs`: 14 pagine, validazione dati superata.
  - `check-site.mjs --portable-root` della libreria: `ok`, nessun errore.
- **Browser:**
  - `file://` con Chrome a 1440px e a 375px (font, immagini e script caricati), anche con movimento ridotto forzato.
  - Nessuno scorrimento orizzontale a 375px; bersagli ≥ 44px.
  - Filtro: conteggi, scaffali vuoti nascosti, parametro `?tipo=` nell’URL.
  - Focus da tastiera sulle bottiglie della volta.
- **Link:** tutti i link esterni dei dati rispondevano il 22 settembre 2026.
- **Da rifare a occhio su un telefono vero:** il tocco che sposta la lanterna.

Dettagli su regole, componenti, scelte scartate e la revisione dopo la prima critica: `research/DESIGN-SYSTEM-MAP.md`. Nessuna analisi, nessun cookie, nessun modulo.
