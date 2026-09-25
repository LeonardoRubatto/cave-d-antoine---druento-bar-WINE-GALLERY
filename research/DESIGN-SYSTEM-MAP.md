# Design Memory è la fonte di verità

Libreria: `C:\.Leonardo\Project\design system (website elements template)`. Non è stata modificata: gli adattamenti vivono solo in questo progetto. Piano di design: `research/design-plan.md`, validato con `node scripts/plan.mjs` (revisione 2 registrata il 22 settembre 2026).

## Stesso marchio, impaginazione propria

Dal sito generale (`caveantoineDRUENTO`) arrivano **solo i token**, perché le due cartelle si leggano come un marchio solo:

- Colori: avorio #f6f3ea, vino #6f272f, oliva #59604a (valore di `BUSINESS-RESEARCH.md`; il CSS del sito generale usa #515b46, differenza da allineare), testo #302a25, secondario #e9e5d8, evidenziatore #e4c780, bordo #d8d0c2.
- Caratteri: Cormorant Garamond e DM Sans, self-hosted; qui incorporati come data URL in `assets/css/fonts.css`, perché Chrome blocca i font locali aperti da `file://` (`rules/architecture.md`, punto 4).
- Scala 1.25: 12/14/16/20/25/31/39/49/61/76; il titolo della volta usa 95, il passo successivo della stessa scala.
- Movimento: `cubic-bezier(.22, 1, .36, 1)` e i passi 150/250/400/600–800 ms.
- Gesti: l’arco come maschera d’immagine e la riga dell’evidenziatore che sale sotto il testo (è il gesto del masthead del sito generale).

**L’impaginazione non è copiata.** Niente insegna centrata, menu in `<dialog>`, footer color vino, paesaggio in parallasse o barra contatti fissa. Al loro posto: una barra a una riga, la volta con la mensola, la carta per scaffali e un colophon.

### Colore della cantina

Il buio della volta non è una tinta nuova: è la scala generata da `node scripts/generate-color-scale.mjs --hue 17 --chroma 0.05 --mode dark`. La tinta 17° è quella di #6f272f misurata in OKLCH. Si usano i passi 5 (#180b0c, fondo), 6 (#2a1a1b), 7 (#412d2d, mensola) e 12 (#c9b1b1, testo secondario). #c9b1b1 su #180b0c dà circa 9,5:1 in WCAG 2.x. La luce della lanterna è l’evidenziatore del marchio.

## Ricerche eseguite (`node scripts/search.mjs`) e decisioni

Letto per ogni risultato il paragrafo «When to use it — and when NOT to».

| Ricerca | Risultati principali | Decisione |
|---|---|---|
| gallery | atmospheric-depth-gallery, spiral-3d-slider, onscroll-clipped-sections, marquee-along-svg-path, feature-carousel | Scartati. WebGL pesante senza movimento ridotto; autoplay senza pausa (viola APG Carousel); riferimento incompleto; marquee che rallenta ma non si ferma; carosello a 4 passi fissi. Una carta di 11 vini deve essere leggibile per intero, non da sfogliare a slide. |
| product grid | fisheye-infinite-grid, canvas-grid-mouse-effect, bento-grid-gradient, sticky-grid-scroll, hover-grid | Scartati. Superficie infinita senza «dove sono» (il suo item.md lo sconsiglia come unica via verso contenuti specifici); effetto solo mouse; bento demo da riscrivere; scroll a 3 colonne fisse; navigazione solo hover senza equivalente da tastiera. Scelto uno scaffale per zona: la forma naturale di una cantina. |
| image detail view | pixel-image-trail, scrolltrigger-image-zoom, image-comparison, image-ripple-effect, images-reveal | `scrolltrigger-image-zoom`: solo riferimento (licenza CodePen non dichiarata), reimplementato nativo, senza pin né marker, sulla sola foto di sfondo. `image-ripple-effect` escluso: il suo item.md dice di non usarlo per foto di prodotto da valutare. `pixel-image-trail` nasconde il contenuto al primo caricamento e sui touch. |
| filter | flexbox-filter-flip, gooey-svg-filter, edge-blur, progressive-blur | `flexbox-filter-flip`: tecnica FLIP reimplementata con Web Animations API (licenza non dichiarata, nessun codice copiato), con controlli nativi come raccomanda l’item e il movimento ridotto che l’originale non ha. Gli altri sono «filter» nel senso di filtro grafico. |
| dark cinematic hero, spotlight cursor reveal, candle light glow, depth parallax layers | hero-dithering/-heatmap/-liquid-metal, mp-cursor, relighting-images (WebGPU), bg-media, parallax-floating | Nessuno usato così com’è: la volta è un archetipo «full-bleed» che la libreria non copre (`rules/layout.md` lo dice). Da `parallax-floating` (Fancy Components, MIT) viene solo l’idea del rientro morbido verso il puntatore, applicata alla foto di fondo, con il ciclo di frame fermo quando nulla si muove. |

## Componenti usati

| Dove | Grounding | Adattamento |
|---|---|---|
| Titolo della volta | `text-effects/mask-reveal-up` (animata, MIT) | Rivelazione per riga una volta sola, testo già nel markup; 600ms, 60ms di sfalsamento. |
| «cantina.» | `text-effects/text-highlighter` (Fancy Components, MIT) | Usato una sola volta nel sito. Sul buio la riga è color vino, non gialla, per il contrasto con il testo avorio. |
| Lanterna | originale | Alone e maschera radiale che seguono puntatore, tocco o focus; bottiglie che si accendono con la distanza. Accensione con transizione CSS su `--light` registrata (`@property`), quindi indipendente dai frame. |
| Riordino della carta | `transitions/flexbox-filter-flip` (riferimento) | FLIP con WAAPI, 400ms; scaffali vuoti nascosti. |
| Zoom della foto | `scroll/scrolltrigger-image-zoom` (riferimento) | Scala 1,06→1 allo scroll, nativa, solo da 768px in su. |

Scartati nella revisione 2, dopo essere stati usati nella prima versione perché presi dal sito generale: pan button Codrops, letter-swap, menu con curva SVG, edge-blur, images-reveal. Vedi sotto.

## Revisione 2: cosa è cambiato e perché

La prima versione è stata giudicata dal committente «AI-like» e troppo copiata dal sito generale. Diagnosi scritta prima di rifare, confrontata con `rules/composition.md`, `rules/content.md` e `rules/forbidden.md`:

- **Similarità senza gerarchia.** Undici card identiche e ogni sezione con occhiello + titolo + paragrafo. Ora ci sono due soli elementi dominanti (la volta, la carta) e gli scaffali raggruppano per vicinanza e regione comune.
- **Riquadri ovunque.** Ne restavano tredici per pagina, tra avvisi e callout. Ora l’avviso segnaposto è una riga stampata con un trattino giallo. L’unico riquadro rimasto è nella pagina legale, dove `seo-legal-baseline.md` §8 lo richiede.
- **Tic riconoscibili.** Card inclinate e sospese, filtri a pillola con contatori, pulsanti con freccia, un trittico di passaggi, grana + alone + vignetta sovrapposti. Tutti rimossi. Le azioni sono testo sottolineato e il filtro è una riga di parole.
- **Impaginazione del fratello.** Sostituita come descritto sopra.
- **Foto di prodotto.** Le targhe tipografiche disegnate al posto delle bottiglie non davano il prodotto. Ora ci sono le foto ufficiali, con fonte e stato del permesso.

## Modello da tastiera (`rules/accessibility.md`)

- **Filtro della carta**, pattern APG Radio Group con radio nativi in un `fieldset`. Tab entra nel gruppo, le frecce cambiano opzione e il filtro si applica al cambio. Il conteggio è annunciato da `role="status"`. Se uno scaffale resta vuoto si nasconde; se lo sono tutti compare un pulsante «Mostra tutta la carta» che riporta il focus sul gruppo.
- **Bottiglie nella volta**: link semplici con nome e produttore in testo accessibile. Tab le raggiunge in ordine e il focus sposta la lanterna sulla bottiglia, che si illumina del tutto con `:focus-visible`. La luce è decorativa: tutte le informazioni sono anche nella carta.
- **Nessun dialog, nessun carosello, nessun contenuto solo al passaggio del mouse.**
- **Bersagli di tocco**: 44px minimi verificati via script a 375px (due link del colophon corretti).

## Responsive

Rivisto dopo una seconda critica del committente («la versione mobile va lavorata»). Problemi misurati sulle schermate a 320/375/768px:
- la carta era alta 5.200px, con bottiglie da 224px in due colonne e bottiglie sole su mezze mensole;
- la mensola della volta nascondeva 4 bottiglie su 9 (2 su tablet);
- il telefono andava a capo a metà numero;
- gli evidenziatori sembravano riquadri gialli;
- nella scheda il nome arrivava sotto la bottiglia.

Contratto attuale:

- **Telefono (< 768px).**
  - La volta è più corta e le nove bottiglie stanno sulla mensola spalla a spalla, alte 36vw.
  - La carta diventa una **lista** da carta dei vini stampata: bottiglia su una piccola mensola a sinistra, nome, produttore, denominazione e avviso a destra. Stessa lettura da scaffale, senza file mezze vuote.
  - Nella scheda vengono prima nome e produttore, poi la bottiglia (volta alta 384px), poi i dati in righe impilate.
  - Il colophon mette prima l'indirizzo, poi la frase, poi i link in riga.
- **Tablet e desktop stretto (768–1023px):** scaffali fino a cinque bottiglie per fila (colonne da 120px minimo) e scheda in due colonne.
- **Evidenziatore:** diventa una sottolineatura spessa che segue il testo e va a capo, invece di uno sfondo sul riquadro di 44px.
- **Link d'azione:** vanno a capo come testo normale, con il numero di telefono tenuto insieme; l'altezza di 44px è data dal padding.
- **Verifica:** 5 pagine × 5 larghezze (320, 375, 414, 768, 1024) misurate nel DOM. Nessuno scorrimento orizzontale. Nessun bersaglio sotto 44px, tranne un link dentro una frase (eccezione WCAG 2.5.8 per il testo in linea).

## Movimento ridotto

`prefers-reduced-motion: reduce` porta tutto allo stato finale:
- luce piena e ferma, con tutte le bottiglie accese;
- nessuna deriva della foto e nessuno zoom;
- nessun riordino animato né rivelazione dei titoli;
- l’evidenziatore è già steso.

Le schermate di controllo sono state fatte anche in questa modalità (`--force-prefers-reduced-motion`).

## Verifica

- `node scripts/check-site.mjs <cartella> --portable-root`: `ok: true`, nessun errore.
- `node scripts/audit.mjs assets`: corretti durata oltre scala (1100→800ms), `linear`, valori fuori griglia (6/3/110/150px). Restano falsi positivi noti: dimensioni della scala tipografica lette come spaziature, `.01ms` del pattern di `motion.md`, «possible-reinvention» per parole chiave, base64 dei font.
- Browser: pagine aperte da `file://` con Chrome headless (font, immagini, script caricati) a 1440px e a 375px (via iframe), più il pannello del browser per il DOM: nessun overflow orizzontale a 375px, filtro (Bianchi 3, Dolci 1 con scaffali vuoti nascosti, URL `?tipo=`), focus sulle bottiglie.
