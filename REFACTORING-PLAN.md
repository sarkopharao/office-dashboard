# Refactoring-Plan: intumind Office Dashboard

## Aktueller Zustand

### Was gut ist
- **Architektur**: Saubere Trennung von API-Routes, Komponenten und Lib-Modulen
- **Supabase-Migration**: Storage + DB korrekt implementiert mit Signed URLs
- **Responsive Design**: CSS Media Queries funktionieren, Desktop/TV bleibt unberührt
- **Auth-System**: Dual-Auth (Supabase Magic Link + Legacy Password) mit Middleware-Schutz
- **Once UI**: Design System konsistent eingesetzt mit Brand Colors

### Was nicht gut ist
- **Code-Duplikation**: Auth-Logik, Logout-Handler und Quote-Rotation an mehreren Stellen dupliziert
- **TypeScript-Qualität**: Mehrere `any`-Types und eslint-disable Kommentare
- **Digistore-Modul**: 325 Zeilen mit doppeltem API-Call-Code und fragiler Fallback-Logik
- **Inline-Styles**: Fast alle Komponenten nutzen inline `style={{}}` statt CSS-Klassen
- **Tote/ungenutzte Dateien**: `icons.ts` ist leer, `MotivationalQuote.tsx` wird nicht importiert

---

## Refactoring-Schritte nach Priorität

### HIGH PRIORITY

#### H1: Duplizierte API-Call-Funktionen in digistore.ts zusammenführen
**Dateien:** `src/lib/digistore.ts`
**Problem:** `apiCall()` (Z. 7-48) und `apiCallWithParams()` (Z. 54-99) sind zu ~95% identisch — gleiche Timeout-Logik, gleiche Error-Handling, gleiche API-Key-Prüfung.
**Lösung:** Zu einer einzigen Funktion `apiCall(endpoint, params?)` zusammenführen mit optionalem `params`-Objekt.
**Komplexität:** Niedrig

#### H2: Duplizierte Auth/Admin-Prüfung zentralisieren
**Dateien:** `src/lib/auth.ts`, `src/app/fotos/page.tsx` (Z. 31-35), `src/app/login/page.tsx` (Z. 8, 36-38), `src/components/Header.tsx` (Z. 24-28)
**Problem:** `isAdmin()`-Logik und `ALLOWED_DOMAIN`-Konstante sind an 3-4 Stellen dupliziert. Jede Stelle parst `NEXT_PUBLIC_ADMIN_EMAILS` einzeln.
**Lösung:**
- `ALLOWED_DOMAIN` nach `constants.ts` verschieben
- Client-seitige `isAdmin(email)` Hilfsfunktion in `src/lib/auth-utils.ts` extrahieren (ohne Server-Imports)
- `fotos/page.tsx` und `Header.tsx` importieren diese Funktion
**Komplexität:** Niedrig

#### H3: Duplizierter Logout-Handler extrahieren
**Dateien:** `src/components/Header.tsx` (Z. 51-61), `src/components/MobileFooter.tsx` (Z. 9-17)
**Problem:** Identischer Logout-Code in beiden Komponenten.
**Lösung:** Custom Hook `useLogout()` in `src/hooks/useLogout.ts` erstellen, der `loggingOut`-State und `handleLogout`-Funktion exportiert.
**Komplexität:** Niedrig

#### H4: Duplizierte Quote-Rotation extrahieren
**Dateien:** `src/components/Slideshow.tsx` (Z. 129-145), `src/components/MotivationalQuote.tsx` (Z. 11-28)
**Problem:** Identische Quote-Rotationslogik (Timer, Fade, Index-Management) in beiden Komponenten.
**Lösung:** Custom Hook `useRotatingQuote()` in `src/hooks/useRotatingQuote.ts` erstellen.
**Komplexität:** Niedrig

#### H5: `any`-Types durch korrekte Typen ersetzen
**Dateien:** `src/lib/digistore.ts` (Z. 6, 53, 134, 137), `src/components/RevenueChart.tsx` (Z. 83), `src/app/api/digistore/sync/route.ts` (Z. 123)
**Problem:** 6+ Stellen mit `eslint-disable @typescript-eslint/no-explicit-any`.
**Lösung:**
- Digistore API-Response-Types definieren in `src/types/index.ts` (z.B. `DigiStorePage`, `DigiStorePurchase`)
- RevenueChart: `CustomTooltip` korrekt tippen mit Recharts `TooltipProps<number, string>`
- Sync-Route: `oldCache` als `SalesData | null` tippen
**Komplexität:** Mittel

---

### MEDIUM PRIORITY

#### M1: Tote/ungenutzte Dateien entfernen
**Dateien:**
- `src/resources/icons.ts` — Leeres `iconLibrary`-Objekt, wird von Providers.tsx importiert aber enthält keine Icons
- `src/components/MotivationalQuote.tsx` — Wird nirgends importiert (Quote-Logik ist komplett in Slideshow.tsx)
- `scripts/migrate-to-supabase.ts` — Migration ist abgeschlossen, Script nicht mehr nötig
**Lösung:** Dateien löschen (icons.ts: leeren Import in Providers.tsx bereinigen).
**Komplexität:** Niedrig

#### M2: SalesGrid-Ladelogik vereinfachen
**Dateien:** `src/components/SalesGrid.tsx` (Z. 35-115)
**Problem:** 3 Refs (`prevOrdersRef`, `isFirstLoadRef`, `pendingDataRef`) + 2 States + verschachtelte Timeouts + Race Conditions zwischen `fetchCached` und `syncAndFetch`. Schwer nachvollziehbar.
**Lösung:** `useReducer` mit klaren Actions (`CACHE_LOADED`, `SYNC_COMPLETE`, `NEW_ORDERS`) statt Ref-Chaos. Oder Custom Hook `useSalesData()` extrahieren.
**Komplexität:** Mittel

#### M3: Hardcoded Placeholder-String in digistore.ts entfernen
**Dateien:** `src/lib/digistore.ts` (Z. 10-11, 57-58)
**Problem:** `apiKey === "dein-api-key-hier"` — Leakt den Placeholder-Wert im Code.
**Lösung:** Nur `if (!apiKey)` prüfen — wenn der Key nicht gesetzt ist, ist er `undefined`, nicht der Placeholder.
**Komplexität:** Niedrig

#### M4: Password-Vergleich timing-safe machen
**Dateien:** `src/app/api/auth/route.ts` (Z. 17)
**Problem:** Plain `===` String-Vergleich für Passwort — theoretisch anfällig für Timing-Attacken.
**Lösung:** `crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected))` verwenden.
**Komplexität:** Niedrig

#### M5: `substr()` durch `substring()` ersetzen
**Dateien:** `src/lib/token-verify.ts` (Z. 14)
**Problem:** `substr()` ist deprecated.
**Lösung:** `hex.substring(i, i + 2)` statt `hex.substr(i, 2)`.
**Komplexität:** Niedrig

#### M6: Konstanten aus Komponenten in constants.ts verschieben
**Dateien:** `src/components/Clock.tsx` (Z. 17-24), `src/components/SalesGrid.tsx` (Z. 11-22, 24)
**Problem:** `dayNames`, `monthNames`, `PRODUCT_GROUP_CONFIG`, `MIN_LOADING_MS` sind innerhalb der Komponenten definiert — bei Clock sogar innerhalb des Render-Zyklus.
**Lösung:** Statische Arrays/Configs nach `constants.ts` verschieben.
**Komplexität:** Niedrig

#### M7: Fallback-Secret in token.ts und token-verify.ts entfernen
**Dateien:** `src/lib/token.ts`, `src/lib/token-verify.ts` (Z. 64)
**Problem:** `"fallback-secret"` als Default wenn `ADMIN_PASSWORD` fehlt — unsicher.
**Lösung:** Throw Error wenn env-Variable fehlt, statt schwaches Fallback zu nutzen.
**Komplexität:** Niedrig

---

### LOW PRIORITY

#### L1: Performance-Optimierung mit React.memo
**Dateien:** `src/components/SalesCard.tsx`, `src/components/RevenueChart.tsx`
**Problem:** Diese Komponenten re-rendern bei jedem Parent-Update, obwohl ihre Props sich selten ändern.
**Lösung:** `React.memo()` wrappen, `useMemo` für `transformData` in RevenueChart.
**Komplexität:** Niedrig

#### L2: DashboardBackground-State vereinfachen
**Dateien:** `src/components/DashboardBackground.tsx`
**Problem:** 3 separate State-Variablen (`bgIndex`, `isTransitioning`, `nextIndex`) für zusammengehörige Logik.
**Lösung:** Zu einem einzigen State-Objekt zusammenfassen: `{ current, next, transitioning }`.
**Komplexität:** Niedrig

#### L3: Slideshow Layout-Switch vereinfachen
**Dateien:** `src/components/Slideshow.tsx` (Z. 251-456)
**Problem:** Riesiger Switch mit 4 Cases à 30+ Zeilen JSX und hardcodierten Positionen.
**Lösung:** Layout-Konfiguration als Daten-Array definieren, Positionen per Config statt per Case.
**Komplexität:** Hoch (viel JSX, viele Details)

#### L4: once-ui.config.js aufräumen
**Dateien:** `src/resources/once-ui.config.js`
**Problem:** Ungenutzte `dataStyle`, leeres `schema`-Objekt, leere `social`-Config, hardcodierte `baseURL`.
**Lösung:** Ungenutzte Sektionen entfernen, `baseURL` aus env-Variable lesen.
**Komplexität:** Niedrig

#### L5: Sounds.ts Event-Listener Cleanup
**Dateien:** `src/lib/sounds.ts` (Z. 46-48)
**Problem:** Event-Listener für `click`/`touchstart`/`keydown` werden hinzugefügt aber nie entfernt.
**Lösung:** Listener nach erstem `resume()` des AudioContext entfernen.
**Komplexität:** Niedrig

#### L6: Photo-API mit Pagination
**Dateien:** `src/app/api/photos/route.ts`
**Problem:** GET generiert Signed URLs für ALLE Fotos bei jedem Request — skaliert nicht.
**Lösung:** Optional Pagination-Parameter (`?limit=20&offset=0`) hinzufügen. Für den aktuellen Umfang (21 Fotos) nicht kritisch.
**Komplexität:** Mittel

---

## Zusammenfassung

| Priorität | Anzahl | Geschätzte Komplexität |
|-----------|--------|----------------------|
| **HIGH** | 5 | 3× Niedrig, 1× Mittel, 1× Niedrig |
| **MEDIUM** | 7 | 5× Niedrig, 1× Mittel, 1× Niedrig |
| **LOW** | 6 | 4× Niedrig, 1× Mittel, 1× Hoch |

**Empfohlene Reihenfolge:** H1 → H2 → H3 → H4 → H5 → M1 → M3 → M4 → M5 → M6 → M7 → M2 → L1-L6

Die HIGH-Items sind alle schnelle Wins (meist Code-Zusammenführung/Extraktion) und verbessern die Wartbarkeit sofort signifikant. M1 (tote Dateien löschen) ist ebenfalls ein schneller Win. Die LOW-Items sind "nice to have" und können bei Gelegenheit gemacht werden.
