// Baut die Beiträge aus inhalte/beitraege/*.md zu statischen HTML-Seiten.
// Keine Abhängigkeiten, nur Node. Aufruf:
//   node scripts/beitraege.mjs           erzeugt public/beitraege/ und aktualisiert die Vorschau auf der Startseite
//   node scripts/beitraege.mjs --pruefen nur prüfen (für CI), schreibt nichts
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const quelle = join(wurzel, 'inhalte', 'beitraege');
const ziel = join(wurzel, 'public', 'beitraege');
const startseite = join(wurzel, 'public', 'index.html');
const nurPruefen = process.argv.includes('--pruefen');

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function datumText(iso) {
  const [j, m, t] = iso.split('-').map(Number);
  return `${t}. ${MONATE[m - 1]} ${j}`;
}

function slugAus(dateiname) {
  return dateiname.replace(/\.md$/, '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function inline(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, url) => {
    const extern = /^https?:\/\//.test(url);
    return `<a href="${url}"${extern ? ' rel="noopener"' : ''}>${t}</a>`;
  });
  return s;
}

// Kleiner Markdown-Umfang: Überschriften, Absätze, Listen, Zitate, Trennlinien.
function markdown(md) {
  const bloecke = md.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
  return bloecke.map((b) => {
    const zeilen = b.split('\n');
    const h = b.match(/^(#{1,3})\s+(.*)$/);
    if (h && zeilen.length === 1) {
      const ebene = Math.min(h[1].length + 1, 4); // # wird h2, die Seite hat schon ein h1
      return `<h${ebene}>${inline(h[2])}</h${ebene}>`;
    }
    if (/^---+$/.test(b)) return '<hr>';
    if (zeilen.every((z) => /^[-*]\s+/.test(z))) {
      return `<ul>${zeilen.map((z) => `<li>${inline(z.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    if (zeilen.every((z) => /^\d+\.\s+/.test(z))) {
      return `<ol>${zeilen.map((z) => `<li>${inline(z.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
    }
    if (zeilen.every((z) => /^>\s?/.test(z))) {
      return `<blockquote><p>${inline(zeilen.map((z) => z.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`;
    }
    return `<p>${inline(zeilen.join(' '))}</p>`;
  }).join('\n');
}

function lies(datei) {
  const roh = readFileSync(join(quelle, datei), 'utf8');
  const m = roh.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${datei}: Kopfbereich zwischen --- und --- fehlt.`);
  const daten = {};
  for (const zeile of m[1].split('\n')) {
    const k = zeile.match(/^(\w+):\s*(.*)$/);
    if (k) daten[k[1]] = k[2].replace(/^["']|["']$/g, '').trim();
  }
  for (const pflicht of ['titel', 'datum', 'zusammenfassung']) {
    if (!daten[pflicht]) throw new Error(`${datei}: Angabe "${pflicht}" fehlt im Kopfbereich.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(daten.datum)) {
    throw new Error(`${datei}: Datum muss die Form JJJJ-MM-TT haben, z. B. 2026-10-25.`);
  }
  const text = m[2];
  const woerter = text.split(/\s+/).filter(Boolean).length;
  return {
    ...daten,
    slug: slugAus(datei),
    entwurf: daten.entwurf === 'ja',
    html: markdown(text),
    minuten: Math.max(1, Math.round(woerter / 200)),
  };
}

function seite({ titel, beschreibung, inhalt, tiefe }) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titel)} · Lola Dieber</title>
  <meta name="description" content="${esc(beschreibung)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/stil.css?v=7">
  <script src="/js/seite.js?v=7" defer></script>
</head>
<body>
  <a class="skip" href="#inhalt">Zum Inhalt springen</a>
  <div class="fortschritt" aria-hidden="true"></div>
  <header class="kopf">
    <div class="wrap kopf-innen">
      <a class="logo" href="/" aria-label="Lola Dieber, zur Startseite"><span class="logo-punkt" aria-hidden="true"></span>Lola Dieber</a>
      <a class="textlink" href="${tiefe ? '/beitraege/' : '/#wissen'}">${tiefe ? 'Alle Beiträge' : 'Zur Startseite'}</a>
    </div>
  </header>
  <main id="inhalt" class="wrap">
${inhalt}
  </main>
  <footer class="fuss">
    <div class="wrap fuss-innen">
      <span>© 2026 Lola Dieber</span>
      <ul>
        <li><a href="/impressum.html">Impressum</a></li>
        <li><a href="/datenschutz.html">Datenschutz</a></li>
      </ul>
    </div>
  </footer>
</body>
</html>
`;
}

function karte(b) {
  return `<li class="beitrag-karte">
        <a href="/beitraege/${b.slug}.html">
          <span class="mono leise">${datumText(b.datum)}${b.thema ? ` · ${esc(b.thema)}` : ''} · ${b.minuten} min</span>
          <h3>${esc(b.titel)}</h3>
          <span class="leise">${esc(b.zusammenfassung)}</span>
          <span class="raum-pfeil" aria-hidden="true">Weiterlesen →</span>
        </a>
      </li>`;
}

const dateien = existsSync(quelle) ? readdirSync(quelle).filter((d) => d.endsWith('.md') && !d.startsWith('_')) : [];
const beitraege = dateien.map(lies).filter((b) => !b.entwurf).sort((a, b) => b.datum.localeCompare(a.datum));

if (nurPruefen) {
  console.log(`${beitraege.length} Beiträge geprüft, alles in Ordnung.`);
  process.exit(0);
}

rmSync(ziel, { recursive: true, force: true });
mkdirSync(ziel, { recursive: true });

for (const b of beitraege) {
  writeFileSync(join(ziel, `${b.slug}.html`), seite({
    titel: b.titel,
    beschreibung: b.zusammenfassung,
    tiefe: true,
    inhalt: `    <article class="beitrag">
      <header class="beitrag-kopf">
        <p class="label">${datumText(b.datum)}${b.thema ? ` · ${esc(b.thema)}` : ''} · ${b.minuten} min Lesezeit</p>
        <h1>${esc(b.titel)}</h1>
        <p class="beitrag-lead leise">${esc(b.zusammenfassung)}</p>
      </header>
      <svg class="atemlinie" viewBox="0 0 1240 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 30 C 160 10, 260 54, 420 34 S 700 22, 860 30 S 1100 30, 1240 30"/></svg>
      <div class="prosa">
${b.html}
      </div>
      <p class="beitrag-fuss"><a class="textlink" href="/beitraege/">Alle Beiträge</a> <a class="textlink" href="/#kontakt">Gespräch anfragen</a></p>
    </article>`,
  }));
}

writeFileSync(join(ziel, 'index.html'), seite({
  titel: 'Beiträge',
  beschreibung: 'Beiträge von Lola Dieber zu Psychologie, ADHS, Achtsamkeit und Entspannung.',
  tiefe: false,
  inhalt: `    <div class="textseite">
      <p class="label">Wissen</p>
      <h1>Beiträge</h1>
      <p class="leise">Gedanken und Wissen aus Psychologie, Beratung und Yoga. Verständlich aufbereitet, mit Übungen für den Alltag.</p>
    </div>
    <ul class="beitrag-liste stapel">
      ${beitraege.length ? beitraege.map(karte).join('\n      ') : '<li class="leise">Hier erscheinen bald die ersten Beiträge.</li>'}
    </ul>`,
}));

// Vorschau der drei neuesten Beiträge auf der Startseite
const html = readFileSync(startseite, 'utf8');
const vorschau = beitraege.slice(0, 3).map(karte).join('\n          ');
const neu = html.replace(
  /(<!-- BEITRAEGE:START -->)[\s\S]*?(<!-- BEITRAEGE:ENDE -->)/,
  `$1\n          ${vorschau || '<li class="leise">Hier erscheinen bald die ersten Beiträge.</li>'}\n          $2`,
);
writeFileSync(startseite, neu);
console.log(`${beitraege.length} Beiträge gebaut.`);
