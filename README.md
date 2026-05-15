# PocketMic

Responsive web app for comedians: browse Toronto-area open mics by weekday (defaults to **today** in **America/Toronto** time), open Instagram and other links from the sheet, and see venues on a map (addresses geocoded via OpenStreetMap Nominatim, cached in the browser).

Data loads at runtime from **seven CSV exports** — one per weekday tab (**Monday** through **Sunday**) on the same Google Sheet.

## Sheet access

For anonymous viewers to load data, the spreadsheet must be reachable without signing in:

1. In Google Sheets: **Share** → **Anyone with the link** → **Viewer**, **or**
2. **File → Share → Publish to web** (CSV export still works for many sheets with link sharing alone).

If load fails, the app shows an error with these hints.

## Pointing at a different spreadsheet

Optional environment variable (e.g. `.env.local`):

| Variable | Purpose |
|----------|---------|
| `VITE_SHEET_ID` | Spreadsheet id from the URL |

Each weekday must still be a **separate tab**. After copying or forking the sheet, update the **`gid`** for each day in [`src/config/sheet.ts`](src/config/sheet.ts) (open each tab in Google Sheets and copy `gid=` from the URL).

If column titles change, update [`src/config/columnMap.ts`](src/config/columnMap.ts).

## Development

```bash
npm install
npm run dev
```

## Build & preview

```bash
npm run build
npm run preview
```

Static output is in `dist/` — suitable for **Netlify**, **Vercel**, **GitHub Pages**, or any static host.

### GitHub Pages (SPA)

If the site is not served from the domain root, set `base` in `vite.config.ts` to your repo path (for example `base: '/repo-name/'`) before building.

## Map / geocoding

Pins use venue addresses from the sheet. The app queues requests (~1 per second) and caches results in `localStorage` under `toronto-open-mics-nominatim-v1` to stay within [Nominatim usage guidelines](https://operations.osmfoundation.org/policies/nominatim/).

If you add **`Latitude` / `Longitude`** (or `Lat` / `Lng`) columns to the sheet, those values are picked up automatically and **skip geocoding** for that row (see [`src/lib/normalize.ts`](src/lib/normalize.ts)).

## Weekday = sheet tab

Which weekday a mic belongs to comes **only** from the bottom tab it lives under (Monday tab → Monday, etc.). Cards show a **“{Weekday} sheet”** badge so that always matches the source document.
