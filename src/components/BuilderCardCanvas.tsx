import { useEffect, useRef, useState } from 'react';
import { renderBuilderCard, type CardData, type CardPhoto } from '../lib/renderCard';

interface BuilderCardCanvasProps {
  data: CardData;
  photo: CardPhoto;
  /** Called with the rendered canvas each time a render completes. */
  onRendered?: (canvas: HTMLCanvasElement) => void;
  onError?: (message: string) => void;
  className?: string;
}

/**
 * Renders the card at full 1080x1350 (or 1080x1080 for PFP) and lets CSS scale it down for display, so
 * what's on screen is pixel-identical to what gets exported. Includes interactive 3D holographic tilt on hover/touch.
 */
export default function BuilderCardCanvas({
  data,
  photo,
  onRendered,
  onError,
  className = '',
}: BuilderCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareOpacity: 0, glareAngle: 135 });

  const onRenderedRef = useRef(onRendered);
  onRenderedRef.current = onRendered;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    renderBuilderCard(canvas, data, photo)
      .then(() => {
        if (!cancelled) onRenderedRef.current?.(canvas);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          onErrorRef.current?.(err instanceof Error ? err.message : 'Could not render the card.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data, photo]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const dx = (x - cx) / cx; // -1 to 1
    const dy = (y - cy) / cy; // -1 to 1

    const rx = -dy * 10; // max 10 deg tilt
    const ry = dx * 10;
    const glareAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    const glareOpacity = Math.min(0.65, Math.hypot(dx, dy) * 0.7);

    setTilt({ rx, ry, glareOpacity, glareAngle });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, glareOpacity: 0, glareAngle: 135 });
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="tilt-card-container relative group cursor-grab active:cursor-grabbing select-none"
    >
      <div
        className="tilt-card-inner relative overflow-hidden rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-transform duration-150 ease-out"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.01, 1.01, 1.01)`,
        }}
      >
        <canvas
          ref={canvasRef}
          data-testid="card-canvas"
          className={className}
          aria-label={`Builder ID card for ${data.name}`}
        />

        {/* Holographic Shimmer Glare Overlay */}
        <div
          className="holo-glare absolute inset-0 rounded-lg pointer-events-none"
          style={{
            opacity: tilt.glareOpacity,
            background: `linear-gradient(${tilt.glareAngle}deg, rgba(255, 255, 255, 0) 0%, rgba(254, 225, 1, 0.3) 45%, rgba(255, 0, 128, 0.3) 55%, rgba(255, 255, 255, 0) 100%)`,
          }}
        />

        {/* Verified Hologram Stamp Badge */}
        <div className="absolute top-3 left-3 bg-brand-black/60 backdrop-blur-md text-brand-accent border border-brand-accent/40 text-[9px] font-body font-bold uppercase tracking-widest px-2.5 py-1 rounded-full opacity-80 pointer-events-none">
          ✨ HOLOGRAPHIC PASS
        </div>
      </div>
    </div>
  );
}

