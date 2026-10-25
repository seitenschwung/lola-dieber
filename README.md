# lola-dieber

Website von Lola Dieber. Statisches HTML in `public/`, Beiträge als Markdown in `inhalte/beitraege/`.

## Neuen Beitrag veröffentlichen (ohne Programmierkenntnisse)

1. Auf GitHub den Ordner `inhalte/beitraege` öffnen.
2. Die Datei `_vorlage.md` öffnen, den Inhalt kopieren.
3. Zurück im Ordner auf **Add file → Create new file** klicken. Dateiname z. B.
   `2026-11-03-adhs-im-alltag.md` (nur Kleinbuchstaben, Zahlen und Bindestriche).
4. Den kopierten Inhalt einfügen und anpassen:
   - `titel`, `datum` (Form `2026-11-03`), `thema`, `zusammenfassung`
   - die Zeile `entwurf: ja` löschen, sobald der Beitrag sichtbar sein soll
5. Unten **Commit changes** klicken. Nach ein paar Minuten ist der Beitrag online:
   unter `/beitraege/` und die drei neuesten auf der Startseite.

Ist im Kopfbereich etwas falsch (z. B. Datum), schlägt der Build fehl und nichts ändert sich auf der Seite.

## Flyer austauschen

Die PDFs liegen in `public/downloads/`. Eine neue Version mit gleichem Dateinamen hochladen,
z. B. `flyer-achtsamkeit.pdf`. Vorschaubilder liegen in `public/bilder/flyer-*.jpg/.webp`.

## Lokal ansehen

```
node scripts/beitraege.mjs
python3 -m http.server 8080 -d public
```
