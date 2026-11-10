# lola-dieber

Website von Lola Dieber (Psychologin M. Sc., Beratung, Lehre, Yoga). Statischer One-Pager plus Beiträge,
ausgeliefert von nginx-unprivileged. Kein package.json, kein npm, keine Abhängigkeiten. Production-URL: TODO.

## Wo liegt was
- `public/index.html`: One-Pager. Zwischen `BEITRAEGE:START/ENDE` steht generierte Vorschau (3 neueste): nicht von Hand ändern
- `public/{impressum,datenschutz,404}.html`: Handgeschrieben
- `public/css/stil.css`, `public/js/seite.js`, `public/fonts/` (selbst gehostet), `public/bilder/` (jpg+webp), `public/downloads/` (Flyer-PDFs)
- `public/beitraege/`: generiert, gitignored
- `inhalte/beitraege/*.md`: Beiträge; `_vorlage.md` erklärt das Format, `_`-Dateien und `entwurf: ja` werden nicht veröffentlicht
- `scripts/beitraege.mjs`: Generator (Node, ohne Abhängigkeiten), auch Beitrags-Template-HTML
- `nginx.conf`: Port 8080, `/healthz`, `/version.txt`, CSP, Cache-Header
- `Dockerfile`: Stufen `build` -> `test` -> nginx. `docker-compose.yml`: Coolify, `image: ${IMAGE}`

## Befehle (alle geprüft)
- Bauen: `node scripts/beitraege.mjs` (schreibt `public/beitraege/`, aktualisiert Vorschau in `index.html`)
- Testen: `node scripts/beitraege.mjs --pruefen` (schreibt nichts; Exit 1 bei ungültigem Kopfbereich/Datum)
- Dev-Server: `node scripts/beitraege.mjs && python3 -m http.server 8080 --bind 0.0.0.0 -d public`
  - Python-Server kennt kein `/healthz` und keine nginx-Header/CSP. Das prüft nur das Docker-Image
  - Im Hintergrund gestartet mit `pkill -f "http.server 8080"` beenden
- Image (CI-Vertrag): `docker build --build-arg APP_VERSION=<sha> .`; lokal meist kein Docker, dann CI abwarten
- Deploy: nur über `main` (squash-merge, CI grün, Pipeline pusht nach ghcr.io und setzt `IMAGE` in Coolify). Nie von Hand

## CI (`.github/workflows/ci.yml`, Owner-verwaltet, nicht änderbar)
- Dünner Aufruf von `seitenschwung/template@v1`: Dockerfile-Build (Stufe `test` zuerst), gehärtet gestartet
  (read-only, nicht root), dann Playwright-Crawl, axe (WCAG AA), Lighthouse >= 90
- `preview`-Job: Screenshot-Kommentar am PR, `main` liefert die Baseline
- Nach Push: `ci_wait` mit Commit-Hash

## Konventionen
- UI-Sprache Deutsch, Anrede „Sie“. Beratung ist keine Heilbehandlung: nie „Therapie anbieten“ o. ä.
- CSP erlaubt nur `'self'`: keine externen Ressourcen, keine Inline-`style`/-Skripte. Verzögerungen via `:nth-child` oder JS `style.setProperty`
- Farben: Kaki `#C9532A` nur Flächen/große Schrift; kleiner Text `#A6421F` (nicht auf Lehm)
- Scroll-Effekte nur über CSS `animation-timeline`, nie Scroll-Listener; `prefers-reduced-motion` schaltet alles ab
- Texte (Copy, Impressum, Datenschutz) sprechen für die Inhaberin: PR mit `manual-review`

## Stolperstellen
- CSS/JS-Cache-Version steht als `?v=7` in jeder HTML-Datei und im Template in `scripts/beitraege.mjs` (Zeile ~103): bei Änderung an `stil.css`/`seite.js` überall gemeinsam erhöhen
- Neue Dateitypen im Image: `.dockerignore` schließt `*.md` aus, nur `inhalte/**/*.md` ist erlaubt
- Beitrags-Dateiname wird zum URL-Slug (Umlaute -> ae/oe/ue, nur `a-z0-9-`)
- Nach `node scripts/beitraege.mjs` zeigt `git status` ggf. eine geänderte `index.html` (Vorschau): mit committen, wenn Beiträge sich geändert haben
- Bilder immer als jpg und webp ablegen; Flyer-PDF unter gleichem Namen ersetzen
