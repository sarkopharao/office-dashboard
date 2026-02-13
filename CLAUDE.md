# intumind Office Dashboard

## Projekt
Live Sales Dashboard auf Flatscreen-TV im intumind Buero (Raspberry Pi, Kiosk-Modus).
Next.js 16 (App Router), TypeScript, Tailwind CSS v4.

## Tech Stack
- **Framework:** Next.js 16 mit App Router
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Fonts:** Outfit (sans-serif, Body) + Lora (serif, nur H1/H2)
- **API:** Digistore24 REST API mit `X-DS-API-KEY` Header
- **Daten-Cache:** File-based JSON (`data/sales-cache.json`)
- **Repo:** https://github.com/sarkopharao/office-dashboard

## intumind Brand Guidelines

### Farben
- **Brand (Tuerkis):** `#009399` (Hauptfarbe fuer Highlights, Buttons, Akzente)
- **Brand Light:** `#00a8af`
- **Brand Dark:** `#007a7f`

### Typographie-Farben
- **Ueberschriften:** `#27313F`
- **Text Normal:** `#505359`
- **Text Medium:** `#8C919C`
- **Text Light:** `#B2BDD1`
- **Text Lighter:** `#D8DDE6`

### Meldungsfarben
- **Fehler:** `#BA2F2F`
- **Erfolg:** `#73A942`
- **Warnung:** `#ECB31B`
- **Info:** `#0E75B9`

### Schriften
- **Body/UI:** Outfit (sans-serif) - alle Gewichte 300-900
- **Ueberschriften (H1/H2):** Lora (serif) - nur Bold 700, nur fuer praeaegnante Stellen (Seitenueberschrift, Kapitelueberschriften, Zitate)
- Tailwind-Klasse: `font-heading` fuer Lora

### Logos
Abgelegt in `/public/intumind-design/`:
- `intumind-logo-laenglich-white.png` - Weisses Logo (fuer dunkle Hintergruende, z.B. Header)
- `intumind-logo-color-laenglich-01.svg` - Farbiges Logo (fuer helle Hintergruende)
- `intumind-logo-color-hochkant.svg` - Farbig hochkant
- `intumind-logo-color-signet-01.svg` - Nur Symbol/Icon
- `intumind-logo_2.0_icon.svg` - Icon Version

### Logo-Regeln
- **Farbig:** Nur auf hellen Hintergruenden (Weiss, Grau, Pastell) - NICHT auf Tuerkis
- **Weiss:** Auf dunklen und farbigen Flaechen
- **Schwarz:** Optional fuer Fusszeilen/Abbinder

## Wichtige Konventionen
- Sprache im Code/Kommentare: Deutsch fuer UI-Texte, Englisch fuer Code
- Tailwind v4: Dynamische Farb-Klassen (`bg-${variable}`) funktionieren NICHT - immer Inline-Styles oder feste Klassen verwenden
- CSS `@import url()` NICHT nach `@import "tailwindcss"` verwenden - fuehrt zu Parse-Error. Stattdessen `next/font/google` nutzen
- API Base URL: `https://www.digistore24.com/api/call/{endpoint}?language=de`
- Dev Server: Port 3000

## Produktgruppen
| Key | Label | Farbe |
|-----|-------|-------|
| PAC | PAC | `#009399` |
| PACL | PACL | `#00a8af` |
| Tiny-PAC | Abnehm-Analyse | `#0E75B9` |
| Club | Club | `#73A942` |
| Leicht 2.0 | Leicht 2.0 | `#ECB31B` |
| Event 2026 | Event | `#007a7f` |
