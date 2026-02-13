# intumind Office Dashboard

## Projekt
Live Sales Dashboard auf Flatscreen-TV im intumind Buero (Raspberry Pi, Kiosk-Modus).
Next.js 16 (App Router), TypeScript, Once UI Design System.

## Tech Stack
- **Framework:** Next.js 16 mit App Router
- **Sprache:** TypeScript
- **Styling:** Once UI Design System (`@once-ui-system/core`)
- **Fonts:** Outfit (sans-serif, Body/Label) + Lora (serif, Heading)
- **API:** Digistore24 REST API mit `X-DS-API-KEY` Header
- **Daten-Cache:** File-based JSON (`data/sales-cache.json`)
- **Repo:** https://github.com/sarkopharao/office-dashboard

## Once UI Konfiguration
- **Config:** `src/resources/once-ui.config.js` (Fonts, Style, Meta)
- **Custom CSS:** `src/resources/custom.css` (intumind Brand Colors als 12-step Scale)
- **Icons:** `src/resources/icons.ts`
- **Providers:** `src/components/Providers.tsx` (ThemeProvider, LayoutProvider, etc.)
- **Theme:** Immer Light-Mode (Dashboard auf TV)
- **Brand Color:** Custom Teal (#009399) via CSS Custom Properties
- **Accent:** Custom Green (#73A942)

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
- **Body/UI:** Outfit (sans-serif) - via `--font-body` und `--font-label`
- **Ueberschriften:** Lora (serif) - Bold 700 via `--font-heading`
- Once UI Text Variants: `body-default-m`, `heading-strong-s`, `label-strong-s`, `display-strong-m`, etc.

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
- Once UI Layout: `Flex`, `Column`, `Grid` statt `<div>` mit CSS-Klassen
- Once UI Typographie: `Text`, `Heading` mit `variant` Props
- Prop-Werte: `horizontal="between"` (nicht `"space-between"`!)
- Custom Styles: Immer via `style={{}}` Props, nicht via Tailwind-Klassen
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
