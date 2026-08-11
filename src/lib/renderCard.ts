import { colors } from '../../brand/colors';
import { drawCoverFitInRect, type CropTransform } from './canvasUtils';
import logoUrl from '../../brand/logo.png';
import goaBadgeUrl from '../../brand/goa-badge.svg';
import studioMarkUrl from '../../brand/studio-mark.svg';

export const CARD_W = 1080;
export const CARD_H = 1350;

export interface CardData {
  name: string;
  role: string;
  title: string;
  serial: string;
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

function applyGrain(ctx: CanvasRenderingContext2D): void {
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.restore();
}

// --- main render ---

export async function renderBuilderCard(
  canvas: HTMLCanvasElement,
  data: CardData,
  photo: CardPhoto,
): Promise<void> {
  await ensureFonts();
  const [logo, badge, studio] = await Promise.all([
    loadAsset(logoUrl),
    loadAsset(goaBadgeUrl),
    loadAsset(studioMarkUrl),
  ]);

  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.textBaseline = 'alphabetic';

  // Background
  ctx.fillStyle = colors.primary;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Hairline frame — echoes the thin-rule motif from their doc design
  ctx.strokeStyle = 'rgba(254, 225, 1, 0.32)';
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
  ctx.fillStyle = colors.accent;
  ctx.font = `600 26px ${FONT_MONO}`;
  drawTrackedCentered(ctx, 'GOA, INDIA  ·  28–31 OCT 2026', CARD_W / 2, 276, 6);

  // Pink rule — wide enough to read as a divider, not an underline of the middot
  ctx.fillStyle = colors.pink;
  ctx.fillRect(CARD_W / 2 - 90, 314, 180, 3);

  // Photo slot
  const slotW = 560;
  const slotH = 700;
  const slotX = (CARD_W - slotW) / 2;
  const slotY = 340;
  const slotR = 10;

  ctx.save();
  ctx.strokeStyle = colors.accent;
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
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(ccx, ccy, cr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.primary;
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
  ctx.fillStyle = colors.accent;
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
  ctx.fillStyle = colors.pink;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = colors.white;
  drawTrackedCentered(ctx, data.title, CARD_W / 2, pillY + pillH / 2 + titleSize / 3, tracking);

  // Footer: pass number (left) + real studio mark (right)
  ctx.fillStyle = 'rgba(255, 251, 232, 0.6)';
  ctx.font = `600 20px ${FONT_MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText(`PASS #${data.serial} / 247`, 72, 1294);

  const smH = 46;
  const smW = smH * (studio.naturalWidth / studio.naturalHeight);
  ctx.drawImage(studio, CARD_W - 72 - smW, 1258, smW, smH);

  // Bake the grain last so it sits over every layer, including the photo
  applyGrain(ctx);
}

export function cardToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export the card as a PNG.'))),
      'image/png',
    );
  });
}
