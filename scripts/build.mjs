#!/usr/bin/env node
// Cantina dei vini — build statica.
//
// Uso:   node scripts/build.mjs                 link al sito generale pubblicato
//        node scripts/build.mjs --sibling=local  link alla cartella fratella (prova da file://)
//
// Legge  data/site.json, data/wines/*.json (una scheda per vino), data/images.json,
//        data/bottles.json
// Scrive index.html, vini/<id>.html, note-legali.html, 404.html, sitemap.xml,
//        robots.txt, assets/css/fonts.css (font incorporati come data URL).
//
// Strumento di authoring: nessuna dipendenza, nessun server. Il sito
// consegnato è fatto solo dei file generati, apribili anche da file://.
// Le schede vengono validate prima di scrivere qualsiasi file: un dato
// senza fonte ferma la build.

import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async (rel) => JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));

const site = await read('data/site.json');
const images = await read('data/images.json');
const bottles = await read('data/bottles.json');
const siblingArg = process.argv.find((arg) => arg.startsWith('--sibling='));
if (siblingArg) site.sibling.mode = siblingArg.split('=')[1];

const wineFiles = (await readdir(path.join(ROOT, 'data/wines'))).filter((f) => f.endsWith('.json'));
const wines = (await Promise.all(wineFiles.map((f) => read(`data/wines/${f}`))))
  .filter((wine) => wine.published)
  .sort((a, b) => a.order - b.order);

/* ------------------------------------------------------------------ */
/* Validazione: niente dato senza fonte, niente chiavi inventate.       */
/* ------------------------------------------------------------------ */
const problems = [];
for (const wine of wines) {
  const where = `data/wines/${wine.id}.json`;
  const sourceIds = new Set((wine.sources || []).map((s) => s.id));
  if (!/^[a-z0-9-]+$/.test(wine.id)) problems.push(`${where}: id non valido`);
  if (!sourceIds.size) problems.push(`${where}: nessuna fonte`);
  if (!site.types[wine.type]) problems.push(`${where}: tipologia "${wine.type}" non definita in site.json`);
  if (!site.areas[wine.area]) problems.push(`${where}: provenienza "${wine.area}" non definita in site.json`);
  const total = wine.grapes.reduce((sum, g) => sum + g.percent, 0);
  if (total !== 100) problems.push(`${where}: le percentuali delle uve sommano ${total}`);
  for (const fact of wine.facts) {
    if (!sourceIds.has(fact.source)) problems.push(`${where}: il dato "${fact.label}" cita la fonte inesistente "${fact.source}"`);
  }
  for (const source of wine.sources) {
    if (!/^https:\/\//.test(source.url)) problems.push(`${where}: fonte ${source.id} senza URL https`);
    if (!source.accessed) problems.push(`${where}: fonte ${source.id} senza data di consultazione`);
  }
  if (wine.cellarNote && !wine.cellarNote.author) problems.push(`${where}: una nota del bancone deve avere un autore`);
}
if (problems.length) {
  console.error('Build fermata:\n  ' + problems.join('\n  '));
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Helper                                                               */
/* ------------------------------------------------------------------ */
const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const B = site.business;
const isPlaceholderDomain = /\.example\//.test(site.baseUrl);
const pad = (n) => String(n).padStart(2, '0');
const grapesText = (wine) => wine.grapes.map((g) => `${g.name} ${g.percent}%`).join(', ');
const vintageShort = (wine) => wine.vintage.inCellar ? String(wine.vintage.inCellar) : 'da confermare';

function sib(key, p) {
  const page = site.sibling.pages[key];
  if (site.sibling.mode === 'local') return `${p}../${encodeURI(site.sibling.localFolder)}/${page.file}`;
  return site.sibling.liveBase + page.live;
}

// rules/images.md: AVIF + WebP, più larghezze, width/height espliciti,
// lazy ovunque tranne l'immagine LCP (fetchpriority="high").
function picture(name, { p, alt, sizes, eager = false, cls = '', attrs = '' }) {
  const img = images[name];
  if (!img) throw new Error(`Immagine "${name}" assente da data/images.json: lancia python scripts/images.py`);
  const set = (fmt) => img.widths.map((w) => `${p}assets/images/foto/${name}-${w}.${fmt} ${w}w`).join(', ');
  const fallback = img.widths.includes(960) ? 960 : img.widths.at(-1);
  const loading = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${p}assets/images/foto/${name}-${fallback}.webp" width="${img.width}" height="${img.height}" alt="${esc(alt)}" ${loading}${cls ? ` class="${cls}"` : ''}${attrs ? ` ${attrs}` : ''}></picture>`;
}

// Foto bottiglia ufficiale (packshot), oppure una sagoma disegnata con
// «foto in arrivo» se il produttore non ne pubblica una scaricabile.
// `height` è l'altezza CSS a cui la bottiglia viene mostrata: serve a
// calcolare `sizes` sulla larghezza reale, non su un valore generico.
function bottle(wine, { p, height, heightMobile = height, eager = false, decorative = false }) {
  const b = bottles[wine.id];
  if (!b || !wine.packshot) {
    return `<span class="bottle-missing"><svg viewBox="0 0 64 240" aria-hidden="true"><path d="M26 4h12v46c0 12 20 26 20 50v130a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V100c0-24 20-38 20-50z"/><path d="M26 18h12"/></svg><span>Foto in arrivo</span></span>`;
  }
  const set = (fmt) => b.variants.map((v) => `${p}assets/images/bottiglie/${wine.id}-${v.height}.${fmt} ${v.width}w`).join(', ');
  const sizes = `(max-width: 767px) ${Math.round(heightMobile * b.ratio)}px, ${Math.round(height * b.ratio)}px`;
  const big = b.variants.at(-1);
  const small = b.variants[0];
  const alt = decorative ? '' : `Bottiglia di ${wine.name}, ${wine.producer.name}`;
  const loading = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${p}assets/images/bottiglie/${wine.id}-${small.height}.webp" width="${big.width}" height="${big.height}" alt="${esc(alt)}" ${loading}></picture>`;
}

const packshotCredit = (wine) => wine.packshot
  ? `Foto: ${esc(wine.packshot.publisher)}, ${wine.packshot.kind === 'importatore' ? 'dal sito dell’importatore' : 'dal sito del produttore'}. Uso da confermare; l’annata in etichetta può non essere quella in cantina.`
  : 'Il produttore non pubblica una foto scaricabile della bottiglia: arriverà quella della Cave.';

/* ------------------------------------------------------------------ */
/* Guscio della pagina: head, barra, colophon                           */
/* Del sito generale restano i token (colori, caratteri, scala,         */
/* movimento), non l'impaginazione: niente insegna, niente menu a        */
/* tendina, niente footer a tutta pagina.                                */
/* ------------------------------------------------------------------ */
function head({ title, description, route, p, noindex = false, jsonld = [] }) {
  const url = site.baseUrl + route;
  const og = `${site.baseUrl}assets/images/og.png`;
  const todo = isPlaceholderDomain
    ? `<!-- ⚠ TODO prima della pubblicazione: il dominio "${site.baseUrl}" è un segnaposto. Cambia baseUrl in data/site.json e rilancia node scripts/build.mjs (canonical, og, twitter, sitemap, robots). -->\n`
    : '';
  return `<!doctype html>
<html lang="it">
<head>
${todo}<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}">
<meta name="theme-color" content="#180b0c">
<link rel="icon" href="${p}favicon.ico" sizes="any">
<link rel="icon" href="${p}assets/images/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${p}assets/images/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="${p}assets/images/favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="${p}assets/images/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="${esc(site.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Cantina dei vini, La Cave d’Antoine: scritta avorio su fondo scuro color vino, con un alone di luce calda">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${og}">
<link rel="stylesheet" href="${p}assets/css/fonts.css">
<link rel="stylesheet" href="${p}assets/css/style.css">
${jsonld.map((data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`).join('\n')}
</head>`;
}

function masthead({ p, current }) {
  return `<a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="bar">
  <div class="bar-inner wrap">
    <a href="${p}index.html" class="brand"><span class="brand-name">La Cave <em>d’Antoine</em></span><span class="brand-room">Cantina dei vini</span></a>
    <nav aria-label="Principale">
      <a href="${p}index.html#carta"${current === 'gallery' ? ' aria-current="page"' : current === 'wine' ? ' aria-current="true"' : ''}>La carta</a>
      <a href="${sib('laCave', p)}">La Cave</a>
      <a href="${B.phoneHref}">Chiama</a>
    </nav>
  </div>
</header>`;
}

function footer({ p }) {
  return `<footer class="colophon">
  <div class="colophon-grid wrap">
    <div>
      <p class="colophon-brand">La Cave <em>d’Antoine</em></p>
      <p>${B.street} · ${B.city} (${B.province})<br>Mercoledì–sabato, 17:30–24:00<br><a href="${B.phoneHref}">${B.phone}</a></p>
    </div>
    <p class="colophon-text">Questa carta non è un negozio: non vendiamo online. Per sapere cosa c’è oggi in cantina, passa al bancone o chiama.</p>
    <nav aria-label="Altri collegamenti">
      <a href="${sib('home', p)}">Il sito della Cave</a>
      <a href="${B.instagram}" rel="noreferrer">Instagram</a>
      <a href="${p}note-legali.html">Note legali e crediti</a>
    </nav>
  </div>
  <div class="colophon-base wrap"><span>© <span data-year>2026</span> La Cave d’Antoine · anteprima privata</span><span>Il piacere di bere, con moderazione.</span><a href="https://telaventis.fr" target="_blank" rel="noopener">Sito di Telaventis</a></div>
</footer>
<script src="${p}assets/js/main.js"></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Slot commerce: oggi "info"; domani contatto, poi un vero carrello    */
/* ------------------------------------------------------------------ */
function renderCommerce(wine) {
  const mode = site.commerce.mode;
  const attrs = `data-commerce-slot data-mode="${mode}" data-wine-id="${wine.id}" data-sku="${esc(wine.commerce.sku ?? '')}"`;
  const phone = site.commerce.contact.phoneHref;
  const info = `<section class="wine-commerce" ${attrs} aria-labelledby="disponibilita">
        <h2 id="disponibilita">Disponibilità</h2>
        <p>Da confermare. Non vendiamo online e questa pagina non dice ancora cosa c’è in cantina: per saperlo, e per il prezzo, chiedi ad Antoine.</p>
        <p><a class="ink-link" href="${phone}">Chiama il ${B.phone}</a></p>
        <p class="quiet-note">Una telefonata non è una prenotazione confermata.</p>
      </section>`;
  switch (mode) {
    case 'info':
      return info;
    case 'contact': {
      if (wine.commerce.availability !== 'disponibile') return info;
      const text = encodeURIComponent(`Vorrei tenere da parte: ${wine.name}, ${wine.producer.name}${wine.vintage.inCellar ? ` ${wine.vintage.inCellar}` : ''}`);
      const c = site.commerce.contact;
      const extra = [
        c.whatsapp ? `<a class="ink-link" href="https://wa.me/${c.whatsapp}?text=${text}" rel="noreferrer">Scrivi su WhatsApp</a>` : '',
        c.email ? `<a class="ink-link" href="mailto:${c.email}?subject=${text}">Scrivi una mail</a>` : '',
      ].join(' ');
      return `<section class="wine-commerce" ${attrs} aria-labelledby="disponibilita">
        <h2 id="disponibilita">In cantina${wine.commerce.price != null ? ` · ${wine.commerce.price.toFixed(2).replace('.', ',')} €` : ''}</h2>
        <p>Chiama e la teniamo da parte: la ritiri al bancone.</p>
        <p><a class="ink-link" href="${c.phoneHref}">Chiama il ${B.phone}</a> ${extra}</p>
      </section>`;
    }
    default:
      throw new Error(`Modalità commerce "${mode}" prevista ma non ancora collegata. Vedi README, "Dal catalogo al negozio".`);
  }
}

/* ------------------------------------------------------------------ */
/* Pagina indice: la volta, poi la carta per scaffali                   */
/* ------------------------------------------------------------------ */
const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const uniq = (list) => [...new Set(list)];

function buildIndex() {
  const p = '';
  const shelfBottles = wines.filter((w) => bottles[w.id] && w.packshot);

  const vaultShelf = shelfBottles.map((wine) => `        <li><a href="vini/${wine.id}.html" class="shelf-bottle" data-lantern-target>${bottle(wine, { p, height: 300, heightMobile: 150, decorative: true })}<span class="sr-only">${esc(wine.name)}, ${esc(wine.producer.name)}</span></a></li>`).join('\n');

  const shelves = Object.entries(site.areas).map(([areaKey, area], s) => {
    const list = wines.filter((w) => w.area === areaKey);
    if (!list.length) return '';
    const grapes = uniq(list.flatMap((w) => w.grapes.map((g) => g.name))).join(', ');
    const items = list.map((wine) => `      <li class="bottle-item" data-type="${wine.type}">
        <a href="vini/${wine.id}.html" class="bottle-link">
          <span class="bottle-stand">${bottle(wine, { p, height: 260, heightMobile: 112 })}</span>
          <span class="bottle-name">${esc(wine.name)}</span>
          <span class="bottle-producer">${esc(wine.producer.name)}</span>
          <span class="bottle-denom">${esc(wine.denomination)}</span>
        </a>
        <p class="bottle-note">Selezione in aggiornamento · annata da confermare</p>
      </li>`).join('\n');
    return `  <section class="shelf wrap" data-shelf aria-labelledby="zona-${areaKey}">
    <header class="shelf-head">
      <p class="shelf-no" aria-hidden="true">${roman[s]}</p>
      <h3 id="zona-${areaKey}">${esc(area.label)}</h3>
      <p class="shelf-meta">${list.length} ${list.length === 1 ? 'vino' : 'vini'} · ${esc(grapes)}</p>
    </header>
    <ol class="shelf-row">
${items}
    </ol>
  </section>`;
  }).join('\n');

  const typeCount = (key) => wines.filter((w) => w.type === key).length;
  const radios = [['', 'Tutti', wines.length], ...Object.entries(site.types).map(([k, v]) => [k, v.plural, typeCount(k)])]
    .map(([value, label, n], i) => `        <label class="type-option"><input type="radio" name="tipo" value="${value}"${i === 0 ? ' checked' : ''}><span>${label}<small>${n}</small></span></label>`).join('\n');

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BarOrPub', name: B.name, telephone: B.phoneHref.replace('tel:', ''), address: { '@type': 'PostalAddress', streetAddress: B.street, addressLocality: B.city, addressRegion: B.province, postalCode: B.postalCode, addressCountry: 'IT' }, geo: { '@type': 'GeoCoordinates', latitude: B.latitude, longitude: B.longitude }, openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '17:30', closes: '00:00' }], sameAs: [B.instagram, B.google] },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Cantina dei vini: selezione in aggiornamento', itemListElement: wines.map((w, i) => ({ '@type': 'ListItem', position: i + 1, url: `${site.baseUrl}vini/${w.id}`, name: `${w.name}, ${w.producer.name}` })) },
  ];

  return `${head({ title: 'Cantina dei vini | La Cave d’Antoine, Druento', description: 'La carta dei vini della Cave d’Antoine a Druento: Langhe, Roero, Canavese e qualche Francia, con provenienza e fonti per ogni bottiglia. Selezione in aggiornamento.', route: '', p, jsonld })}
<body class="page-gallery">
${masthead({ p, current: 'gallery' })}

<main id="contenuto">
<section class="vault-wrap" aria-labelledby="vault-title">
  <div class="vault" data-lantern data-depth-scene>
    <div class="vault-media" data-depth="36" aria-hidden="true">
      ${picture('bottiglie', { p, alt: '', sizes: '(max-width: 767px) 100vw, min(1440px, 100vw)', eager: true, cls: 'vault-photo', attrs: 'data-scroll-zoom' })}
    </div>
    <div class="vault-dark" aria-hidden="true"></div>
    <div class="vault-glow" aria-hidden="true"></div>

    <div class="vault-copy">
      <h1 id="vault-title"><span class="reveal-lines" data-reveal>
        <span class="reveal-line"><span class="reveal-line-inner">Scendi</span></span>
        <span class="reveal-line"><span class="reveal-line-inner">in <mark class="text-highlight" data-highlight>cantina.</mark></span></span>
      </span></h1>
      <p class="vault-lead">Undici vini per cominciare: Langhe e Roero, l’Astigiano, il Canavese e tre bottiglie di Francia.</p>
      <p class="print-note print-note-dark">${esc(site.placeholderNotice)}.</p>
      <p class="vault-links"><a href="#carta" class="ink-link">Leggi la carta</a><a href="${B.phoneHref}" class="ink-link">Chiedi cosa c’è oggi:&nbsp;<span class="nowrap">${B.phone}</span></a></p>
    </div>

    <div class="vault-shelf">
      <ul aria-label="Le bottiglie sulla mensola">
${vaultShelf}
      </ul>
    </div>
    <div class="vault-foot">
      <p class="vault-hint" aria-hidden="true">Col cursore, o col tasto Tab, porti la luce sulle bottiglie.</p>
      <p class="vault-credit">Bottiglie: foto ufficiali di produttori e importatori, uso da confermare. Sfondo: ${esc(site.photos.bottiglie.credit)}, non è la cantina della Cave.</p>
    </div>
  </div>
</section>

<section class="carta" id="carta" aria-labelledby="carta-title">
  <div class="carta-head wrap">
    <h2 id="carta-title">La carta</h2>
    <div class="carta-intro">
      <p>Per ogni vino: zona, uve e i dati dichiarati da chi lo fa, con la fonte accanto. Niente prezzi e niente note di assaggio: quelle le scrive Antoine.</p>
      <p class="print-note">${esc(site.placeholderNotice)}. Vini verificati sulle fonti il ${site.researchDateLabel}; annate e disponibilità da confermare al bancone.</p>
    </div>
    <form class="type-filter" data-filters hidden aria-label="Filtra la carta per tipologia">
      <fieldset>
        <legend>Mostra</legend>
${radios}
      </fieldset>
      <p class="filter-status" data-filter-status role="status" aria-live="polite">${wines.length} vini</p>
    </form>
  </div>
${shelves}
  <div class="carta-empty wrap" data-filter-empty hidden>
    <p>Per ora nessun vino di questo tipo.</p>
    <button type="button" class="ink-link" data-filter-reset>Mostra tutta la carta</button>
  </div>
</section>
</main>

${footer({ p })}`;
}

/* ------------------------------------------------------------------ */
/* Scheda vino (un solo template per tutte)                             */
/* ------------------------------------------------------------------ */
function buildWine(wine, index) {
  const p = '../';
  const type = site.types[wine.type];
  const prev = wines[(index - 1 + wines.length) % wines.length];
  const next = wines[(index + 1) % wines.length];
  const refNumber = new Map(wine.sources.map((s, i) => [s.id, i + 1]));
  const vintage = wine.vintage.reference
    ? `Scheda consultata: annata ${wine.vintage.reference}. Annata in cantina: ${wine.vintage.inCellar ?? 'da confermare'}.`
    : 'Da confermare: la fonte consultata non indica un’annata.';
  const title = `${wine.name}, ${wine.producer.name} | Cantina dei vini`;
  const description = `${wine.denomination} di ${wine.producer.name}: ${grapesText(wine)}. Provenienza e fonti verificate. Selezione in aggiornamento della Cave d’Antoine, Druento.`;
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'La carta', item: site.baseUrl },
      { '@type': 'ListItem', position: 2, name: wine.name, item: `${site.baseUrl}vini/${wine.id}` },
    ],
  }];

  return `${head({ title, description, route: `vini/${wine.id}`, p, jsonld })}
<body class="page-wine">
${masthead({ p, current: 'wine' })}

<main id="contenuto">
<nav class="breadcrumb wrap" aria-label="Percorso"><ol><li><a href="../index.html#carta">La carta</a></li><li><a href="../index.html#zona-${wine.area}">${esc(site.areas[wine.area].label)}</a></li><li><span aria-current="page">${esc(wine.name)}</span></li></ol></nav>

<article class="wine wrap" aria-labelledby="wine-title">
  <header class="wine-head">
    <p class="wine-producer">${esc(wine.producer.name)}${wine.producer.place ? ` · ${esc(wine.producer.place)}` : ''}</p>
    <h1 id="wine-title">${esc(wine.name)}</h1>
    <p class="wine-denom">${esc(wine.denomination)} · ${type.label.toLowerCase()}</p>
    <p class="print-note">${esc(site.placeholderNotice)}: questo vino è un esempio documentato, non ancora una bottiglia confermata della Cave.</p>
  </header>

  <figure class="wine-figure">
    <div class="wine-vault">
      <div class="wine-vault-glow" aria-hidden="true"></div>
      <div class="wine-bottle">${bottle(wine, { p, height: 520, heightMobile: 280, eager: true })}</div>
    </div>
    <figcaption>${packshotCredit(wine)}</figcaption>
  </figure>

  <div class="wine-body">

    <section aria-labelledby="provenienza">
      <h2 id="provenienza">Provenienza</h2>
      <dl class="fact-list">
        <div><dt>Denominazione</dt><dd>${esc(wine.denomination)}</dd></div>
        <div><dt>Produttore</dt><dd><a href="${wine.producer.url}" rel="noreferrer">${esc(wine.producer.name)}</a></dd></div>
        <div><dt>Zona</dt><dd>${esc(wine.origin.zone)} · ${esc(wine.origin.region)}, ${esc(wine.origin.country)}</dd></div>
        <div><dt>Uve</dt><dd>${esc(grapesText(wine))}</dd></div>
        <div><dt>Annata</dt><dd>${vintage}</dd></div>
      </dl>
    </section>

    <section aria-labelledby="dal-produttore">
      <h2 id="dal-produttore">Secondo le fonti</h2>
      <dl class="fact-list">
${wine.facts.map((f) => `        <div><dt>${esc(f.label)}</dt><dd>${esc(f.value)} <a href="#fonte-${refNumber.get(f.source)}" class="ref" aria-label="Fonte ${refNumber.get(f.source)}">[${refNumber.get(f.source)}]</a></dd></div>`).join('\n')}
      </dl>
    </section>

    <section class="cellar-note" aria-labelledby="nota">
      <h2 id="nota">La nota del bancone</h2>
      ${wine.cellarNote
        ? `<blockquote><p>${esc(wine.cellarNote.text)}</p></blockquote><p class="quiet-note">${esc(wine.cellarNote.author)}</p>`
        : '<p>Ancora da scrivere. Le impressioni di assaggio arriveranno da Antoine: qui non inventiamo note a suo nome.</p>'}
    </section>

    ${renderCommerce(wine)}

    <section class="sources" aria-labelledby="fonti">
      <h2 id="fonti">Fonti</h2>
      <ol>
${wine.sources.map((s, i) => `        <li id="fonte-${i + 1}">${esc(s.publisher)}, ${esc(s.kind)}: <a href="${esc(s.url)}" rel="noreferrer">apri la fonte</a>. <span>Consultata il ${site.researchDateLabel}.</span></li>`).join('\n')}
      </ol>
      <p>Etichetta e immagini ufficiali: <a href="${esc(wine.packshot?.page ?? wine.labelReference)}" rel="noreferrer">pagina ${wine.packshot?.kind === 'importatore' ? 'dell’importatore' : 'del produttore'}</a>. Nomi e marchi appartengono al produttore.</p>
    </section>
  </div>
</article>

<nav class="wine-pager wrap" aria-label="Altri vini della carta">
  <a href="${prev.id}.html"><small>Precedente</small>${esc(prev.name)}</a>
  <a href="../index.html#carta" class="pager-all">Tutta la carta</a>
  <a href="${next.id}.html" class="pager-next"><small>Successivo</small>${esc(next.name)}</a>
</nav>
</main>

${footer({ p })}`;
}

/* ------------------------------------------------------------------ */
/* Note legali: ogni fatto non verificato, per esteso                   */
/* ------------------------------------------------------------------ */
function buildLegal() {
  const p = '';
  const withPackshot = wines.filter((w) => w.packshot && bottles[w.id]);
  const withoutPackshot = wines.filter((w) => !w.packshot || !bottles[w.id]);
  return `${head({ title: 'Note legali e crediti | Cantina dei vini', description: 'Chi pubblica la cantina dei vini della Cave d’Antoine, cosa non è ancora verificato, privacy, fonti e crediti.', route: 'note-legali', p })}
<body class="page-legal">
${masthead({ p, current: 'legal' })}

<main id="contenuto">
<article class="legal-page wrap">
  <p class="quiet-note">ULTIMO AGGIORNAMENTO · ${site.researchDateLabel.toUpperCase()}</p>
  <h1>Note legali<br><em>e crediti.</em></h1>
  <div class="legal-notice" role="note">
    <strong>Pagina non pronta per la pubblicazione.</strong>
    <p>La galleria è un’anteprima da verificare con il titolare. Restano aperti: ragione sociale e partita IVA, email di contatto, titolare del trattamento, dominio definitivo, hosting e la lista reale dei vini. I campi tra parentesi quadre vanno compilati prima del lancio.</p>
  </div>
  <nav class="legal-index" aria-label="Contenuti della pagina"><a href="#editore">Chi pubblica</a><a href="#non-verificato">Cosa non è verificato</a><a href="#privacy">Privacy</a><a href="#alcol">Alcol</a><a href="#crediti">Crediti</a></nav>

  <section id="editore">
    <h2>Chi pubblica il sito</h2>
    <p>Nome commerciale: ${esc(B.name)}.<br>${B.street} · ${B.city} (${B.province}), ${B.postalCode}.<br>Telefono: <a href="${B.phoneHref}">${B.phone}</a>.<br>Email: [EMAIL DA CONFERMARE].</p>
    <p>Ragione sociale e partita IVA: [DA CONFERMARE CON IL TITOLARE]. Un repertorio commerciale, non un registro ufficiale, indica «La Cave D’Antoine di Sollami Antoine Sebastien», P.IVA 13296230017, attiva a Druento (<a href="https://registroaziende.it/azienda/la-cave-dantoine-di-sollami-antoine-sebastien-druento" rel="noreferrer">RegistroAziende</a>). Resta una pista non verificata e non va letta come dato certo.</p>
    <p>Hosting: [DA CONFERMARE]. Il sito generale della Cave è pubblicato su Cloudflare Pages; questa galleria non ha ancora un indirizzo definitivo.</p>
    <p>Sito generale della Cave: <a href="${sib('home', p)}">La Cave d’Antoine</a>. Le sue <a href="${sib('legal', p)}">note legali</a> valgono per quel sito.</p>
  </section>

  <section id="non-verificato">
    <h2>Cosa non è ancora verificato</h2>
    <ol class="legal-list">
      <li><strong>La selezione non è la lista della Cave.</strong> I ${wines.length} vini sono esempi reali, scelti per affinità con un’enoteca piemontese, in attesa della lista definitiva del titolare. Nessuno di essi è confermato come presente in cantina.</li>
      <li><strong>Annate.</strong> Dove compare un anno, è l’annata della scheda tecnica consultata. L’annata eventualmente in cantina è da confermare.</li>
      <li><strong>Disponibilità e prezzi.</strong> Non indicati. Il sito non vende e non accetta ordini o prenotazioni online; una telefonata non è una prenotazione confermata.</li>
      <li><strong>Dati tecnici.</strong> Riportati dalle fonti citate in ogni scheda, consultate il ${site.researchDateLabel}. Possono cambiare da un’annata all’altra. Alcune fonti sono importatori statunitensi, non i produttori: lo indichiamo scheda per scheda.</li>
      <li><strong>Produttori e marchi.</strong> Nomi di produttori, vini e denominazioni appartengono ai rispettivi titolari. Non esiste alcun rapporto di fornitura, partnership o sponsorizzazione dichiarato tra la Cave e i produttori citati.</li>
      <li><strong>Foto delle bottiglie.</strong> Sono le immagini ufficiali pubblicate da produttori e importatori (elenco sotto). Nessuna delle fonti ne dichiara la licenza: le usiamo per riconoscere il vino in questa anteprima, e prima del lancio pubblico vanno autorizzate dai produttori o sostituite con foto delle bottiglie della Cave. L’annata in etichetta può non essere quella in cantina.</li>
      <li><strong>Foto di sfondo.</strong> La parete di bottiglie nella volta è una foto d’atmosfera da Unsplash: non è la cantina della Cave.</li>
      <li><strong>Note di assaggio.</strong> Assenti di proposito: arriveranno da Antoine. Non attribuiamo al locale parole che non ha scritto.</li>
      <li><strong>Dati del locale.</strong> Indirizzo, telefono e orari vengono dal sito generale, che li ha consultati sulla scheda Google il 31 agosto 2026. Eventuali chiusure straordinarie non sono note.</li>
    </ol>
  </section>

  <section id="privacy">
    <h2>Privacy</h2>
    <p>La galleria non ha moduli, account, strumenti di analisi o profilazione, né cookie. Non salva nulla nel browser. Font e immagini sono serviti dal sito stesso: nessuna richiesta a Google Fonts o ad altri servizi al caricamento.</p>
    <p>I filtri della galleria possono comparire nell’indirizzo della pagina (per esempio <code>?tipo=rosso</code>), così un link filtrato si può condividere. Quell’indirizzo, come ogni richiesta, può finire nei registri tecnici dell’hosting.</p>
    <p>I link a Instagram, ai produttori e agli importatori aprono servizi esterni, soggetti alle loro condizioni e informative.</p>
    <p>Prima del lancio pubblico l’informativa va completata con titolare del trattamento e contatti, finalità e basi giuridiche, destinatari, conservazione e diritti, secondo gli strumenti effettivamente attivi. Riferimenti: <a href="https://www.garanteprivacy.it/home/principi-fondamentali-del-trattamento" rel="noreferrer">principi del trattamento</a> e <a href="https://www.garanteprivacy.it/faq/cookie" rel="noreferrer">FAQ sui cookie del Garante</a>.</p>
  </section>

  <section id="alcol">
    <h2>Alcol e moderazione</h2>
    <p>Il vino si beve con moderazione. Questo sito presenta vini, non li vende e non si rivolge ai minori.</p>
  </section>

  <section id="crediti">
    <h2>Proprietà intellettuale e crediti</h2>
    <p>Testi, grafica delle targhe e codice della galleria sono realizzati per La Cave d’Antoine da <a href="https://telaventis.fr" target="_blank" rel="noopener">Telaventis</a>; dominio, hosting e sorgenti passano al titolare al momento del lancio.</p>
    <h3>Foto delle bottiglie</h3>
    <ul class="legal-list">
${withPackshot.map((w) => `      <li>${esc(w.name)}: <a href="${esc(w.packshot.page)}" rel="noreferrer">${esc(w.packshot.publisher)}</a>.</li>`).join('\n')}
    </ul>
    <p>Trattamento: solo ritaglio dei margini; per Braida e Saracco il fondo bianco è stato reso trasparente, per Lapierre è stata isolata una bottiglia da una foto di gruppo. Etichette mai ritoccate. ${withoutPackshot.length ? `Senza foto ufficiale scaricabile: ${withoutPackshot.map((w) => esc(w.name)).join(', ')}.` : ''} Dettagli in research/product-image-manifest.json.</p>
    <h3>Foto di sfondo</h3>
    <p><a href="https://unsplash.com/photos/a-bunch-of-bottles-of-wine-are-stacked-on-a-shelf-LaLp0Jzl4_0" rel="noreferrer">${esc(site.photos.bottiglie.credit)}</a>: bottiglie impolverate su scaffali di legno, usata secondo la <a href="https://unsplash.com/license" rel="noreferrer">licenza Unsplash</a>, senza ritocchi.</p>
    <h3>Caratteri e componenti</h3>
    <p>Cormorant Garamond e DM Sans (SIL Open Font License), incorporati nel sito. Il titolo della volta usa due effetti con licenza MIT adattati: «Mask Reveal Up» di animata (codse) e «Text Highlighter» di Fancy Components (Daniel Petho). La lanterna, il riordino della carta e lo zoom della foto sono scritti da zero; per gli ultimi due abbiamo guardato, senza copiarne codice, due pen CodePen di GreenSock dalla licenza non dichiarata, e il lieve movimento della foto di fondo riprende un’idea di «Parallax Floating» di Fancy Components (MIT). L’elenco completo è nel file CREDITS.md del progetto.</p>
    <p>Fonti dei dati: indicate in fondo a ogni scheda vino, con la data di consultazione.</p>
  </section>
  <p class="quiet-note legal-updated">Ultimo aggiornamento: ${site.researchDateLabel}.</p>
</article>
</main>

${footer({ p })}`;
}

function build404() {
  const p = '';
  return `${head({ title: 'Qui non c’è niente | Cantina dei vini', description: 'La pagina cercata non esiste. Torna alla cantina dei vini della Cave d’Antoine.', route: '404', p, noindex: true })}
<body class="page-404">
${masthead({ p, current: '404' })}

<main id="contenuto">
<section class="not-found wrap">
  <p class="quiet-note">Errore 404</p>
  <h1>Questo scaffale<br><em>è vuoto.</em></h1>
  <p>La pagina che cercavi non c’è, o non c’è più. Magari la bottiglia è finita.</p>
  <p><a href="${p}index.html#carta" class="ink-link">Torna alla carta</a></p>
</section>
</main>

${footer({ p })}`;
}

/* ------------------------------------------------------------------ */
/* Scrittura                                                            */
/* ------------------------------------------------------------------ */
async function fontsCss() {
  const faces = [
    ['Cormorant Garamond', 'normal', '300 700', 'cormorant-garamond.woff2'],
    ['Cormorant Garamond', 'italic', '300 700', 'cormorant-garamond-italic.woff2'],
    ['DM Sans', 'normal', '100 1000', 'dm-sans.woff2'],
  ];
  const blocks = await Promise.all(faces.map(async ([family, style, weight, file]) => {
    const data = (await readFile(path.join(ROOT, 'assets/fonts', file))).toString('base64');
    return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${data}) format('woff2')}`;
  }));
  return `/* Generato da scripts/build.mjs: font variabili SIL OFL incorporati come data URL,\n   così vengono caricati anche aprendo il sito da file:// (rules/architecture.md). */\n${blocks.join('\n')}\n`;
}

const out = [
  ['index.html', buildIndex()],
  ['note-legali.html', buildLegal()],
  ['404.html', build404()],
  ...wines.map((wine, i) => [`vini/${wine.id}.html`, buildWine(wine, i)]),
];

const routes = [
  ['', '1.0'],
  ...wines.map((w) => [`vini/${w.id}`, '0.7']),
  ['note-legali', '0.3'],
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(([route, priority]) => `  <url>\n    <loc>${site.baseUrl}${route}</loc>\n    <lastmod>${site.researchDate}</lastmod>\n    <priority>${priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;

await rm(path.join(ROOT, 'vini'), { recursive: true, force: true });
await mkdir(path.join(ROOT, 'vini'), { recursive: true });
for (const [file, html] of out) await writeFile(path.join(ROOT, file), html, 'utf8');
await writeFile(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}sitemap.xml\n`, 'utf8');
await writeFile(path.join(ROOT, 'assets/css/fonts.css'), await fontsCss(), 'utf8');

console.log(`Build completata: ${out.length} pagine (${wines.length} schede vino), link al sito generale in modalità "${site.sibling.mode}".`);
if (isPlaceholderDomain) console.log(`Attenzione: baseUrl è ancora il segnaposto ${site.baseUrl}`);
