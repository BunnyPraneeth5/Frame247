import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  clamp,
  DEFAULT_CROP,
  drawCoverFit,
  getMaxOffsetPx,
  MAX_ZOOM,
  MIN_ZOOM,
  type CropTransform,
} from '../lib/canvasUtils';

interface CropCanvasProps {
  image: HTMLImageElement;
  imgW: number;
  imgH: number;
  /** width / height of the crop frame, e.g. 4/5 to match the card's photo slot. */
  aspect: number;
  /** CSS width in px of the editor; height is derived from aspect. */
  width?: number;
  transform: CropTransform;
  onTransformChange: (transform: CropTransform) => void;
}

export default function CropCanvas({
  image,
  imgW,
  imgH,
  aspect,
  width = 300,
  transform,
  onTransformChange,
}: CropCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameW = width;
  const frameH = width / aspect;

  // Keep the latest transform in a ref so the native wheel listener (bound once)
  // always reads current state without needing to rebind on every change.
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const onChangeRef = useRef(onTransformChange);
  onChangeRef.current = onTransformChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = frameW * dpr;
    canvas.height = frameH * dpr;
    canvas.style.width = `${frameW}px`;
    canvas.style.height = `${frameH}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCoverFit(ctx, image, imgW, imgH, frameW, frameH, transform);
  }, [image, imgW, imgH, transform, frameW, frameH]);

  const getMaxOffset = useCallback(
    () => getMaxOffsetPx(imgW, imgH, frameW, frameH, transformRef.current.zoom),
    [imgW, imgH, frameW, frameH],
  );

  // React binds onWheel passively, so preventDefault() there is ignored and the
  // page scrolls while zooming. A native non-passive listener fixes that.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      const t = transformRef.current;
      const zoom = clamp(t.zoom * (1 - e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM);
      onChangeRef.current({ ...t, zoom });
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; offX: number; offY: number } | null>(null);
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        offX: transform.offsetXNorm,
        offY: transform.offsetYNorm,
      };
      setDragging(true);
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        zoom: transform.zoom,
      };
      dragStart.current = null;
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const t = transformRef.current;

    if (pointers.current.size >= 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const zoom = clamp(pinchStart.current.zoom * (dist / pinchStart.current.dist), MIN_ZOOM, MAX_ZOOM);
      onTransformChange({ ...t, zoom });
      return;
    }

    if (pointers.current.size === 1 && dragStart.current) {
      const { x: maxX, y: maxY } = getMaxOffset();
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onTransformChange({
        ...t,
        offsetXNorm: maxX > 0 ? clamp(dragStart.current.offX + dx / maxX, -1, 1) : 0,
        offsetYNorm: maxY > 0 ? clamp(dragStart.current.offY + dy / maxY, -1, 1) : 0,
      });
    }
  };

  const endPointer = (e: PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 1) {
      const [remaining] = pointers.current.values();
      dragStart.current = {
        x: remaining.x,
        y: remaining.y,
        offX: transformRef.current.offsetXNorm,
        offY: transformRef.current.offsetYNorm,
      };
    } else if (pointers.current.size === 0) {
      dragStart.current = null;
      setDragging(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="relative overflow-hidden rounded-lg ring-[3px] ring-brand-accent touch-none select-none"
        style={{ width: frameW, height: frameH }}
      >
        <canvas
          ref={canvasRef}
          data-testid="crop-canvas"
          data-transform={`${transform.zoom.toFixed(3)},${transform.offsetXNorm.toFixed(3)},${transform.offsetYNorm.toFixed(3)}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          className={`block ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        />
      </div>
      <div className="flex items-center gap-3 w-full" style={{ maxWidth: frameW }}>
        <span className="font-body text-brand-offwhite/50 text-[10px] uppercase tracking-wider">Zoom</span>
        <input
          type="range"
          aria-label="Zoom"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={transform.zoom}
          onChange={(e) => onTransformChange({ ...transform, zoom: Number(e.target.value) })}
          className="flex-1 accent-brand-pink"
        />
        <button
          type="button"
          data-testid="reset-zoom"
          onClick={() => onTransformChange(DEFAULT_CROP)}
          className="font-body text-[10px] uppercase tracking-wider text-brand-accent hover:underline underline-offset-2"
        >
          Reset
        </button>
      </div>
      <p className="font-body text-brand-offwhite/40 text-[10px] text-center">
        Drag to reposition · pinch or scroll to zoom
      </p>
    </div>
  );
}
