# Frame247

Upload a photo, get a branded **Hacker House Goa 2026 Builder ID card** — downloadable as a
real PNG and shareable straight to X with `#FrameInGoa` pre-filled.

Named for the 247 builders who make it to the residency.

No login. No signup gate. No backend — crop, compositing and text rendering all happen
client-side in the browser.

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · native Canvas API · `heic2any` (lazy-loaded)

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # serve the production build
```

## Brand

Colours and fonts were pulled from **hhgoa.com's own compiled CSS**, not eyeballed from
screenshots — see `brand/colors.ts`.

| Token      | Hex       | Use                                        |
| ---------- | --------- | ------------------------------------------ |
| `primary`  | `#0B6839` | main green surface                         |
| `accent`   | `#FEE101` | wordmark, CTAs, eyebrow labels, badges     |
| `pink`     | `#FF0080` | गोवा badge outline, callouts, title pill   |
| `offwhite` | `#FFFBE8` | light surfaces                             |

Fonts: **Imbue** (display) + **Victor Mono** (body/labels) — the faces the live site uses.

Real assets in `brand/`: `logo.png` (wordmark), `goa-badge.svg`, `studio-mark.svg`.

## How it works

- `src/lib/canvasUtils.ts` — cover-fit crop maths. Resolution-independent: the same
  transform renders identically in the 280px editor and the 1080×1350 export, so the
  preview is exactly what you download.
- `src/lib/renderCard.ts` — composites the card, then bakes a **riso-style grain** over
  every layer. The grain is in the exported PNG, not just on screen.
- `src/lib/builderTitles.ts` — titles in HH Goa's voice, weighted by the stack you enter.
  Deterministic per (name, role, reroll) so re-renders never silently change the title.
- `src/lib/heicConvert.ts` — HEIC→JPEG. The decoder is ~1.3MB, so it's dynamically
  imported; only iPhone users pay for it (main bundle stays ~70KB gzip).

## Share behaviour

1. **Primary** — `navigator.share()` with the PNG attached (mobile Safari/Chrome).
2. **Fallback** — downloads the PNG, then opens X's tweet intent with the caption and
   `#FrameInGoa` pre-filled, and tells the user to attach the file that just downloaded.

No backend means no dynamic OG-image route; the native share path attaches the real image
instead.

## Tests

An end-to-end suite drives the real app in headless Chrome — real file picker, real pointer
drags, real downloads verified as PNGs on disk:

```bash
pip install pillow pillow-heif && python tests/make-fixtures.py
npm i -D puppeteer-core
node tests/e2e.mjs                              # against npm run dev
TEST_URL=http://localhost:4173 node tests/e2e.mjs   # against npm run preview
```

`puppeteer-core` is intentionally **not** a saved dependency — install it only when running
the suite.

## Deploy

Configured for both Vercel (`vercel.json`) and Netlify (`netlify.toml`).

```bash
npx vercel --prod     # or: npx netlify deploy --prod
```
