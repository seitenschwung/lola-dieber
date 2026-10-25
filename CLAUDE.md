# lola-dieber

## Purpose
Website von Lola Dieber: Psychologin (M. Sc.), Psychotherapeutin in Ausbildung, Beraterin (ADHS, Gruppen, Konzepte), Dozentin, Yogalehrerin. Production-URL: TODO.

## Stack
Statisches HTML/CSS/JS in `public/`, ausgeliefert von nginx-unprivileged. Keine Build-Tools, keine Abhängigkeiten.

## Commands
- Install/Build: keine
- Dev server: `python3 -m http.server 8080 --bind 0.0.0.0 -d public`
- Tests: keine eigenen; CI prüft axe und Lighthouse

## Layout
- `public/index.html`: One-Pager (Begleitung, Beratung, Lehre, Yoga, Über mich, Kontakt)
- `public/css/stil.css`: Farb-Tokens (Salbeinebel, Tannentinte, Kaki), Light/Dark
- `public/fonts/`: selbst gehostete Schriften (DSGVO, kein Google-CDN)
- `public/bilder/`: bearbeitete Fotos

## CI and deploy contract
`.github/workflows/ci.yml` is a thin caller of the shared pipeline in `seitenschwung/template`,
managed by the owner. You can't change workflow files, so build the project to fit it:
- If `package-lock.json` exists, CI runs `npm ci`, then `npm run lint`, `npm test` and
  `npm run build` when those scripts exist. Keep them green locally before pushing.
- If a `Dockerfile` exists, CI builds it and runs the image hardened: read-only root
  filesystem, `/tmp` as the only writable path, no capabilities, as the image's (non-root)
  user. The image must:
  - listen on port **8080**
  - answer `GET /healthz` with 200
  - serve `GET /version.txt` with the build argument `APP_VERSION` (the commit SHA)
- If `/` returns HTML, CI also crawls the site with Playwright, axe (WCAG AA, serious and
  critical findings fail) and Lighthouse (accessibility, best practices and SEO at least 90).
- A Dockerfile stage named `test` (`FROM ... AS test`) is built first: put lint and tests there for
  stacks without `package-lock.json`. It must not be the last stage.
- `docker-compose.yml` keeps the CrowdSec labels (`crowdsec.enable=true`,
  `crowdsec.labels.type=nginx`) and the json-file log rotation on every service that serves traffic.
  The CrowdSec agent on the server reads the container logs through them. Don't remove them; the
  type must match a parser there, so ask the owner before changing it.
- `docker-compose.yml` is what Coolify runs. Keep `image: ${IMAGE}`: the pipeline pushes
  the tested image to ghcr.io and tells Coolify which tag to run.
- `main` is production: every merge deploys after green CI. Work on branches, open PRs.

## Conventions
- UI-Sprache Deutsch, Anrede „Sie“.
- Keine externen Ressourcen (CSP in `nginx.conf` erlaubt nur `'self'`), keine Inline-Styles/-Skripte.
- Kaki `#C9532A` nur für Flächen und große Schrift; für kleinen Text `#A6421F` (nicht auf Malve).
- Beratung ist keine Heilbehandlung: keine Formulierungen wie „Therapie anbieten“.
