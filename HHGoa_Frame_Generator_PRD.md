# PRD — Frame247 (HH Goa 2026 Frame / Builder ID Generator)

## 1. Summary

**Project name: Frame247** — named after the 247 builders who make it to the residency ("The Road to 247").

Build a single-page, frontend-only web app where a user uploads a photo and instantly gets back a branded Hacker House Goa 2026 graphic — either a circular/square profile-picture frame, or a Builder ID card — ready to download and share to X with the caption and `#FrameInGoa` pre-filled. No login, no upload gate, no backend server. Everything (crop, compositing, text rendering) happens client-side in the browser.

**Deadline:** 11:59 PM, 13 August 2026
**Submission:** live working link via https://forms.gle/jM5hTaGvsrfEfixPA

## 2. Goals

- Ship ONE format extremely well rather than two done half-well. Default to **Format B (Builder ID Card)** for more differentiation — switch to Format A only if time is short.
- Feel unmistakably "HH Goa 2026" — exact brand colors, real wordmark, recurring visual motifs — not a generic badge with a logo pasted on.
- Be fast: upload → result should feel like seconds, no spinner-heavy loading screen.
- Work flawlessly on mobile, since most users will be on their phones.
- Nail ONE small memorable detail that makes this feel crafted, not templated.

## 3. Brand Reference (source of truth)

Pull real assets directly from the live site before building anything:

- Site: https://hhgoa.com/
- Wordmark image: https://hhgoa.com/assets/Hacker%20house.png
- गोवा (Goa, Hindi) badge/lockup: https://hhgoa.com/assets/goa_hindi.svg
- Studio credit mark: https://hhgoa.com/assets/2-47.svg
- Sunrise graphic: https://hhgoa.com/assets/Sun%20rise.png
- Footer trees illustration: https://hhgoa.com/assets/footer%20trees.png
- There is a "Brand Kit" link referenced in the site footer — check hhgoa.com directly for it and use official assets/colors if accessible instead of recreating them.

### Color palette (verify against live assets, these are close approximations)
- Deep forest green (primary): `#1E4D2B`
- Cream / off-white (background): `#F5F2E8`
- Hot pink/magenta (accent): `#E91E8C`
- Bright yellow (accent): `#F5D000`
- White text on green surfaces

### Typography
- Display/headers: bold, rounded geometric sans — Poppins ExtraBold or Rubik Bold as the closest free fallback
- The "HACKER HOUSE गोवा" lockup: yellow bold display type + a pink rounded sticker-badge containing the Devanagari गोवा — this is the single most recognizable brand asset, use it prominently
- Small labels/eyebrows: same sans, bold, uppercase, letter-spaced (e.g. "GOA, INDIA · 28–31 OCT 2026")
- Body: same sans family, regular weight

### Recurring brand voice & motifs
- Tagline: "Less Noise. More Signal."
- Day 3 tagline: "heads down. ship or ship"
- Studio credit: "2:47 PM STUDIO" (small, bottom corner, easter-egg style)
- Event line: "GOA, INDIA · 28–31 OCT 2026"
- Mandatory hashtag: `#FrameInGoa`
- Thin hairline dividers, numbered yellow circular badges, pink left-border callouts — these are their doc-design signatures, echo at least one in the UI or generated graphic

## 4. Functional Requirements

### 4.1 Upload
- Accept jpg, png, HEIC (convert client-side via `heic2any`), webp
- No manual cropping required — auto center-crop to fill the target frame using cover-fit logic
- Support drag-to-reposition and pinch/scroll-to-zoom so users can fine-tune the auto-crop
- Handle portrait, landscape, and square source photos correctly

### 4.2 Format B — Builder ID Card (primary target)
- Fields: Name (required), Stack/Role (required), auto-generated "Builder Title"
- Builder Title: pulled from a curated array written in HH Goa's voice (punchy, confident — not generic "Code Ninja" clichés), can be weighted/selected based on the stack/role input
- Optional nice-to-have: small serial/pass number (e.g. `#026`) generated per session for authenticity
- Layout: photo in a defined slot + name + role + builder title + event date line + गोवा badge, styled like an event badge/boarding pass, output at **1080×1350** (portrait, ready for X post)

### 4.3 Format A — PFP Frame (fallback/secondary if time allows)
- Uploaded photo stays centered and fully visible; frame wraps around it in brand colors/motifs
- Output at **1080×1080** (square, ready for X profile picture)

### 4.4 Generation
- All compositing done via HTML5 Canvas API (no server round-trip)
- Should feel near-instant (no visible loading screen for the render step itself)

### 4.5 Download
- Real downloadable PNG file (`canvas.toBlob()` → object URL → `<a download>`), not just an on-screen render

### 4.6 Share to X
- Primary path (mobile): `navigator.share()` with the generated image file attached directly, if supported
- Fallback path: open X's tweet intent (`https://twitter.com/intent/tweet?text=...`) with a pre-filled caption including `#FrameInGoa`, and clearly instruct the user to attach the already-downloaded image
- This satisfies the "image attached OR working link preview" requirement without needing a backend — do not build a dynamic OG-image server route unless there is spare time after everything else is solid

### 4.7 No login, no gate
- The entire flow (upload → fields → generate → download/share) must work in one uninterrupted pass with zero signup or auth

## 5. Non-Functional Requirements

- Mobile-first responsive layout (test on an actual phone, not just devtools emulation)
- Fast initial load — keep bundle lean, avoid heavy animation libraries
- Graceful error states for unsupported file types or overly large files
- Works in current Chrome/Safari mobile and desktop

## 6. Tech Stack

- Vite + React + TypeScript (lighter and faster to ship than Next.js; no backend needed for the chosen share approach)
- Tailwind CSS for styling
- `heic2any` for HEIC conversion
- Native Canvas API for compositing (no fabric.js needed — adds weight without real benefit here)
- Deploy: Vercel or Netlify, connected to GitHub for continuous deploy from hour one

## 7. Suggested File Structure (project root: `frame247/`)

```
/brand
  logo.svg              (HACKER HOUSE गोवा wordmark)
  goa-badge.svg          (गोवा pink sticker badge)
  colors.ts              (exported hex constants)
  fonts/                 (self-hosted brand font files if not using Google Fonts)
/src
  /components
    PhotoUpload.tsx
    CropCanvas.tsx        (drag/zoom/crop logic)
    BuilderCardCanvas.tsx (Format B render)
    FrameCanvas.tsx        (Format A render)
    BuilderForm.tsx
    ShareActions.tsx      (download + share to X)
  /lib
    builderTitles.ts       (curated title array + selection logic)
    heicConvert.ts
    canvasUtils.ts         (cover-fit crop math, text rendering helpers)
  App.tsx
  main.tsx
```

## 8. User Flow

1. Landing screen: brand header, short one-line pitch, format toggle (Builder ID / PFP Frame) if building both, otherwise straight to upload
2. Upload photo (tap-to-choose or drag-drop) — instant preview appears on the canvas/frame
3. Drag/zoom to adjust crop if needed
4. (Format B only) Fill in name + stack/role → builder title auto-generates
5. Tap Generate → canvas renders composited graphic (near-instant, small satisfying transition/animation)
6. Result screen: preview of final graphic, Download button, Share to X button
7. Share to X → native share sheet with image attached (mobile) or X intent tab opens with caption pre-filled (desktop/fallback)

## 9. The "Memorable Detail" (pick one, execute well)

Choose exactly one and polish it rather than attempting several:
- A quick brand-color flash transition (green → pink → yellow) right before the result reveals
- A subtle grain/riso-print texture baked into the final exported PNG for a tactile, printed feel
- A "VERIFIED BUILDER" stamp effect that animates onto the card on generation

## 10. Explicitly Out of Scope (for this deadline)

- User accounts / login
- Server-side OG image generation for auto link-preview sharing (skip unless everything else is done early)
- Team/combined multi-person frames (mentioned as a stretch idea on hhgoa.com but not in the core shortlisting brief — only attempt if core flow is finished with time to spare)
- Print-ready export (this is a share-to-social graphic, not a printable badge)

## 11. Acceptance Criteria

- [ ] Upload works for jpg, png, and HEIC on a real iPhone
- [ ] Off-center, portrait, and landscape photos all auto-crop sensibly with no distortion
- [ ] Generation feels instant, no visible long loading state
- [ ] Downloaded file is a real PNG, opens correctly outside the browser
- [ ] Share to X opens with caption + `#FrameInGoa` pre-filled, and image is attachable (native share or manual attach with clear instruction)
- [ ] No login or signup step anywhere in the flow
- [ ] Fully usable on a real mobile phone screen
- [ ] Colors, logo, and motifs are visibly and specifically HH Goa 2026 branded, not generic
- [ ] Deployed to a live public URL, verified working in an incognito window before submission
