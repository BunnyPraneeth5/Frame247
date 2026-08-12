import { colors, THEMES, STICKERS, type ThemePreset } from '../../brand/colors';
import { drawCoverFitInRect, type CropTransform } from './canvasUtils';
import logoUrl from '../../brand/logo.png';
import goaBadgeUrl from '../../brand/goa-badge.svg';
import studioMarkUrl from '../../brand/studio-mark.svg';
import sunriseUrl from '../../brand/sunrise.png';
import footerTreesUrl from '../../brand/footer-trees.png';

export const CARD_W = 1080;
export const CARD_H = 1350;

export const PFP_W = 1080;
export const PFP_H = 1080;

export interface CardData {
  name: string;
  role: string;
  title: string;
  serial: string;
  theme?: 'forest' | 'sunrise' | 'cyber' | 'vintage';
  format?: 'id' | 'pfp';
  stickers?: string[];
}

export interface CardPhoto {
  img: CanvasImageSource;
  imgW: number;
  imgH: number;
  transform: CropTransform;
}

const FONT_DISPLAY = '"Imbue", serif';
const FONT_MONO = '"Victor Mono", ui-monospace, monospace';

// --- asset + font loading (cached across renders so re-renders stay instant) ---

const assetCache = new Map<string, Promise<HTMLImageElement>>();

function loadAsset(src: string): Promise<HTMLImageElement> {
  let p = assetCache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error(`Failed to load brand asset: ${src}`));
      im.src = src;
    });
    assetCache.set(src, p);
  }
  return p;
}

let fontsReady: Promise<void> | null = null;

/**
 * Canvas silently falls back to a default font if the webfont hasn't loaded yet,
 * so the render must wait for the real faces or the card comes out in Times.
 */
function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      try {
        await Promise.all([
          document.fonts.load(`700 72px ${FONT_DISPLAY}`),
          document.fonts.load(`500 72px ${FONT_DISPLAY}`),
          document.fonts.load(`700 28px ${FONT_MONO}`),
          document.fonts.load(`600 24px ${FONT_MONO}`),
        ]);
        await document.fonts.ready;
      } catch {
        // If font loading fails we still render — better a fallback face than nothing.
      }
    })();
  }
  return fontsReady;
}

/** Warm the caches so the first Generate tap doesn't pay the load cost. */
export function preloadCardAssets(): void {
  void ensureFonts();
  void loadAsset(logoUrl);
  void loadAsset(goaBadgeUrl);
  void loadAsset(studioMarkUrl);
  void loadAsset(sunriseUrl);
  void loadAsset(footerTreesUrl);
}

// --- text helpers ---

function measureTracked(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  const chars = [...text];
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width;
  return w + tracking * Math.max(0, chars.length - 1);
}

/** Canvas has no letter-spacing in older Safari, so tracked text is drawn per glyph. */
function drawTrackedCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  tracking: number,
): void {
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  let x = cx - measureTracked(ctx, text, tracking) / 2;
  for (const ch of [...text]) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + tracking;
  }
  ctx.textAlign = prevAlign;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startPx: number,
  weight: number,
  family: string,
  minPx: number,
): number {
  let size = startPx;
  for (;;) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minPx) return size;
    size -= 2;
  }
}

// --- the memorable detail: riso-style grain baked into the exported PNG ---

let grainTile: HTMLCanvasElement | null = null;

function getGrainTile(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const size = 180;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d')!;
  const data = tctx.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    // Centered around mid-grey so 'overlay' pushes pixels both lighter and darker,
    // which reads as ink texture rather than a dirty film.
    const v = 128 + (Math.random() - 0.5) * 168;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = tile;
  return tile;
}

function applyGrain(ctx: CanvasRenderingContext2D, width = CARD_W, height = CARD_H): void {
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawStickersOnCanvas(
  ctx: CanvasRenderingContext2D,
  stickers: string[] | undefined,
  t: ThemePreset,
  isPFP = false,
): void {
  if (!stickers || stickers.length === 0) return;
  const stickerData = STICKERS.filter((s) => stickers.slice(0, 2).includes(s.id));
  stickerData.forEach((st, idx) => {
    ctx.save();
    const rot = idx % 2 === 0 ? -0.12 : 0.14;
    const x = isPFP ? (idx === 0 ? 170 : 910) : (idx === 0 ? 170 : 910);
    const y = isPFP ? (idx === 0 ? 760 : 770) : (idx === 0 ? 380 : 980);

    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.font = `700 22px ${FONT_MONO}`;
    const textW = ctx.measureText(st.text).width;
    const px = 20;
    const boxW = textW + px * 2;
    const boxH = 46;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-boxW / 2 + 4, -boxH / 2 + 4, boxW, boxH, 10);
    ctx.fill();

    // Sticker background
    ctx.fillStyle = t.pink;
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(st.text, 0, 7);
    ctx.restore();
  });
}

// --- main render ---

export async function renderBuilderCard(
  canvas: HTMLCanvasElement,
  data: CardData,
  photo: CardPhoto,
): Promise<void> {
  if (data.format === 'pfp') {
    return renderPFPFrame(canvas, data, photo);
  }

  await ensureFonts();
  const [logo, badge, studio, footerTrees] = await Promise.all([
    loadAsset(logoUrl),
    loadAsset(goaBadgeUrl),
    loadAsset(studioMarkUrl),
    loadAsset(footerTreesUrl),
  ]);

  const t = THEMES[data.theme || 'forest'] || THEMES.forest;

  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.textBaseline = 'alphabetic';

  // Background
  ctx.fillStyle = t.primary;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Footer trees silhouette
  ctx.save();
  ctx.globalAlpha = 0.25;
  const treesW = CARD_W - 72;
  const treesH = treesW * (footerTrees.naturalHeight / footerTrees.naturalWidth);
  ctx.drawImage(footerTrees, 36, CARD_H - 36 - treesH, treesW, treesH);
  ctx.restore();

  // Hairline frame — echoes the thin-rule motif from their doc design
  ctx.strokeStyle = `${t.accent}52`;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, CARD_W - 72, CARD_H - 72);

  // Wordmark + गोवा badge (ratios lifted from the live site's own layout)
  const wmW = 620;
  const wmH = wmW * (logo.naturalHeight / logo.naturalWidth);
  const wmY = 92;
  ctx.drawImage(logo, (CARD_W - wmW) / 2, wmY, wmW, wmH);

  const bW = wmW * 0.1325;
  const bH = bW * (badge.naturalHeight / badge.naturalWidth);
  ctx.drawImage(badge, CARD_W / 2 - bW / 2, wmY + wmH * 0.4634 - bH / 2, bW, bH);

  // Event line
  ctx.fillStyle = t.accent;
  ctx.font = `600 26px ${FONT_MONO}`;
  drawTrackedCentered(ctx, 'GOA, INDIA  ·  28–31 OCT 2026', CARD_W / 2, 276, 6);

  // Pink rule — wide enough to read as a divider, not an underline of the middot
  ctx.fillStyle = t.pink;
  ctx.fillRect(CARD_W / 2 - 90, 314, 180, 3);

  // Photo slot
  const slotW = 560;
  const slotH = 700;
  const slotX = (CARD_W - slotW) / 2;
  const slotY = 340;
  const slotR = 10;

  ctx.save();
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(slotX - 3, slotY - 3, slotW + 6, slotH + 6, slotR + 3);
  ctx.stroke();
  ctx.restore();

  drawCoverFitInRect(
    ctx,
    photo.img,
    photo.imgW,
    photo.imgH,
    slotX,
    slotY,
    slotW,
    slotH,
    photo.transform,
    slotR,
  );

  // Yellow numbered pass badge on the photo — their circular-badge motif
  const cr = 48;
  const ccx = slotX + slotW - cr - 14;
  const ccy = slotY + cr + 14;
  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.arc(ccx, ccy, cr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.primary;
  ctx.font = `700 25px ${FONT_MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText(`#${data.serial}`, ccx, ccy + 9);
  ctx.textAlign = 'left';

  // Name
  ctx.fillStyle = colors.white;
  const nameSize = fitFontSize(ctx, data.name, 880, 72, 700, FONT_DISPLAY, 34);
  ctx.font = `700 ${nameSize}px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.fillText(data.name, CARD_W / 2, 1120);
  ctx.textAlign = 'left';

  // Role / stack
  ctx.fillStyle = t.accent;
  const roleText = data.role.toUpperCase();
  let roleSize = 24;
  ctx.font = `700 ${roleSize}px ${FONT_MONO}`;
  while (measureTracked(ctx, roleText, 5) > 880 && roleSize > 14) {
    roleSize -= 1;
    ctx.font = `700 ${roleSize}px ${FONT_MONO}`;
  }
  drawTrackedCentered(ctx, roleText, CARD_W / 2, 1162, 5);

  // Builder title, as a pink sticker pill
  const pillMaxW = 800;
  const pillPadX = 34;
  const tracking = 4;
  let titleSize = 28;
  ctx.font = `700 ${titleSize}px ${FONT_MONO}`;
  while (measureTracked(ctx, data.title, tracking) + pillPadX * 2 > pillMaxW && titleSize > 16) {
    titleSize -= 1;
    ctx.font = `700 ${titleSize}px ${FONT_MONO}`;
  }
  const pillW = Math.min(measureTracked(ctx, data.title, tracking) + pillPadX * 2, pillMaxW);
  const pillH = 60;
  const pillX = (CARD_W - pillW) / 2;
  const pillY = 1190;
  ctx.fillStyle = t.pink;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = colors.white;
  drawTrackedCentered(ctx, data.title, CARD_W / 2, pillY + pillH / 2 + titleSize / 3, tracking);

  // Footer: pass number badge pill (left) + real studio mark (right)
  const passText = `PASS #${data.serial} / 247`;
  ctx.font = `700 20px ${FONT_MONO}`;
  const passTextW = ctx.measureText(passText).width;
  const passPillW = passTextW + 32;
  const passPillH = 44;
  const passPillX = 64;
  const passPillY = 1258;

  // Badge drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(passPillX + 3, passPillY + 3, passPillW, passPillH, passPillH / 2);
  ctx.fill();

  // Badge fill & stroke
  ctx.fillStyle = t.accent;
  ctx.strokeStyle = t.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(passPillX, passPillY, passPillW, passPillH, passPillH / 2);
  ctx.fill();
  ctx.stroke();

  // Badge text
  ctx.fillStyle = t.primary;
  ctx.textAlign = 'center';
  ctx.fillText(passText, passPillX + passPillW / 2, passPillY + 28);
  ctx.textAlign = 'left';

  const smH = 46;
  const smW = smH * (studio.naturalWidth / studio.naturalHeight);
  ctx.drawImage(studio, CARD_W - 72 - smW, 1258, smW, smH);

  // Draw optional custom stickers
  drawStickersOnCanvas(ctx, data.stickers, t, false);

  // Bake the grain last so it sits over every layer, including the photo
  applyGrain(ctx, CARD_W, CARD_H);
}

/** Format A: PFP Frame (1080x1080 square for social media avatars) */
export async function renderPFPFrame(
  canvas: HTMLCanvasElement,
  data: CardData,
  photo: CardPhoto,
): Promise<void> {
  await ensureFonts();
  const [logo, badge, studio, footerTrees] = await Promise.all([
    loadAsset(logoUrl),
    loadAsset(goaBadgeUrl),
    loadAsset(studioMarkUrl),
    loadAsset(footerTreesUrl),
  ]);

  const t = THEMES[data.theme || 'forest'] || THEMES.forest;

  canvas.width = PFP_W;
  canvas.height = PFP_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.textBaseline = 'alphabetic';

  // Background
  ctx.fillStyle = t.primary;
  ctx.fillRect(0, 0, PFP_W, PFP_H);

  // Footer trees silhouette
  ctx.save();
  ctx.globalAlpha = 0.22;
  const treesW = PFP_W - 60;
  const treesH = treesW * (footerTrees.naturalHeight / footerTrees.naturalWidth);
  ctx.drawImage(footerTrees, 30, PFP_H - 30 - treesH, treesW, treesH);
  ctx.restore();

  // Outer border
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, PFP_W - 12, PFP_H - 12);

  // Hairline inner frame
  ctx.strokeStyle = `${t.accent}52`;
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, PFP_W - 60, PFP_H - 60);

  // Header wordmark & Goa badge
  const wmW = 500;
  const wmH = wmW * (logo.naturalHeight / logo.naturalWidth);
  const wmY = 56;
  ctx.drawImage(logo, (PFP_W - wmW) / 2, wmY, wmW, wmH);

  const bW = wmW * 0.1325;
  const bH = bW * (badge.naturalHeight / badge.naturalWidth);
  ctx.drawImage(badge, PFP_W / 2 - bW / 2, wmY + wmH * 0.4634 - bH / 2, bW, bH);

  // Center Photo circular / rounded crop frame
  const slotW = 680;
  const slotH = 680;
  const slotX = (PFP_W - slotW) / 2;
  const slotY = 180;
  const slotR = 340; // Circle

  ctx.save();
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(PFP_W / 2, slotY + slotH / 2, slotR + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawCoverFitInRect(
    ctx,
    photo.img,
    photo.imgW,
    photo.imgH,
    slotX,
    slotY,
    slotW,
    slotH,
    photo.transform,
    slotR,
  );

  // Pass badge circle
  const cr = 46;
  const ccx = slotX + slotW - cr - 20;
  const ccy = slotY + cr + 20;
  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.arc(ccx, ccy, cr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.primary;
  ctx.font = `700 24px ${FONT_MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText(`#${data.serial}`, ccx, ccy + 8);

  // Bottom Name & Title
  ctx.fillStyle = colors.white;
  const nameSize = fitFontSize(ctx, data.name, 840, 56, 700, FONT_DISPLAY, 30);
  ctx.font = `700 ${nameSize}px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.fillText(data.name, PFP_W / 2, 920);

  // Event & Studio Footer
  ctx.fillStyle = t.accent;
  ctx.font = `600 20px ${FONT_MONO}`;
  drawTrackedCentered(ctx, `${data.role.toUpperCase()} · GOA 2026`, PFP_W / 2, 960, 4);

  // Title pill bottom banner
  ctx.fillStyle = t.pink;
  ctx.font = `700 20px ${FONT_MONO}`;
  const titleText = ` ${data.title} `;
  const tw = measureTracked(ctx, titleText, 3) + 32;
  const th = 40;
  ctx.beginPath();
  ctx.roundRect((PFP_W - tw) / 2, 985, tw, th, th / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  drawTrackedCentered(ctx, data.title, PFP_W / 2, 1011, 3);

  // Pass number badge pill (bottom left) & small studio credit (bottom right)
  const passTextPFP = `PASS #${data.serial} / 247`;
  ctx.font = `700 16px ${FONT_MONO}`;
  const passTextPW = ctx.measureText(passTextPFP).width;
  const passPillPW = passTextPW + 24;
  const passPillPH = 32;
  const passPillPX = 48;
  const passPillPY = 1028;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(passPillPX + 2, passPillPY + 2, passPillPW, passPillPH, passPillPH / 2);
  ctx.fill();

  ctx.fillStyle = t.accent;
  ctx.strokeStyle = t.primary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(passPillPX, passPillPY, passPillPW, passPillPH, passPillPH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = t.primary;
  ctx.textAlign = 'center';
  ctx.fillText(passTextPFP, passPillPX + passPillPW / 2, passPillPY + 21);
  ctx.textAlign = 'left';

  const smH = 28;
  const smW = smH * (studio.naturalWidth / studio.naturalHeight);
  ctx.drawImage(studio, PFP_W - 48 - smW, 1032, smW, smH);

  // Draw optional custom stickers
  drawStickersOnCanvas(ctx, data.stickers, t, true);

  // Bake grain
  applyGrain(ctx, PFP_W, PFP_H);
}

export function cardToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export the card as a PNG.'))),
      'image/png',
    );
  });
}

