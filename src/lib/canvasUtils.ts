export interface CropTransform {
  /** >=1. 1 = the tightest zoom-out that still fully covers the frame. */
  zoom: number;
  /** -1..1, position within the available pan range at the current zoom. */
  offsetXNorm: number;
  /** -1..1, position within the available pan range at the current zoom. */
  offsetYNorm: number;
}

export const DEFAULT_CROP: CropTransform = { zoom: 1, offsetXNorm: 0, offsetYNorm: 0 };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Scale at which the image just barely covers the frame with no empty edges. */
export function getCoverBaseScale(imgW: number, imgH: number, frameW: number, frameH: number): number {
  return Math.max(frameW / imgW, frameH / imgH);
}

/** How far (in frame-space px) the image can be panned in each axis before revealing empty space. */
export function getMaxOffsetPx(
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number,
  zoom: number,
): { x: number; y: number } {
  const scale = getCoverBaseScale(imgW, imgH, frameW, frameH) * zoom;
  const dispW = imgW * scale;
  const dispH = imgH * scale;
  return {
    x: Math.max(0, (dispW - frameW) / 2),
    y: Math.max(0, (dispH - frameH) / 2),
  };
}

/**
 * Draws `img` onto `ctx` so it covers a `frameW`x`frameH` rect with no distortion
 * (cover-fit), honoring the given zoom/pan. Resolution-independent: the same
 * `transform` produces the same relative crop at any frameW/frameH, so this can be
 * called with a small on-screen frame for live editing and a large one (e.g.
 * 1080x1350) for the final export and get the same crop.
 */
export function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number,
  transform: CropTransform,
): void {
  ctx.clearRect(0, 0, frameW, frameH);
  drawCoverFitInRect(ctx, img, imgW, imgH, 0, 0, frameW, frameH, transform);
}

/**
 * Same cover-fit crop as `drawCoverFit`, but into an arbitrary rect on a larger
 * canvas, clipped to that rect. This is what lets the on-screen editor and the
 * 1080x1350 export share one crop implementation — identical `transform` in,
 * identical framing out, at any scale.
 */
export function drawCoverFitInRect(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  imgW: number,
  imgH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  transform: CropTransform,
  radius = 0,
): void {
  const scale = getCoverBaseScale(imgW, imgH, w, h) * transform.zoom;
  const dispW = imgW * scale;
  const dispH = imgH * scale;
  const { x: maxX, y: maxY } = getMaxOffsetPx(imgW, imgH, w, h, transform.zoom);

  const drawX = x + (w - dispW) / 2 + transform.offsetXNorm * maxX;
  const drawY = y + (h - dispH) / 2 + transform.offsetYNorm * maxY;

  ctx.save();
  ctx.beginPath();
  if (radius > 0) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, dispW, dispH);
  ctx.restore();
}

/** Loads a File into an <img> element (browsers apply EXIF rotation automatically). */
export function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode this image.'));
    };
    img.src = url;
  });
}
