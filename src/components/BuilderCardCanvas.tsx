import { useEffect, useRef } from 'react';
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
 * Renders the card at full 1080x1350 and lets CSS scale it down for display, so
 * what's on screen is pixel-identical to what gets exported.
 */
export default function BuilderCardCanvas({
  data,
  photo,
  onRendered,
  onError,
  className,
}: BuilderCardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  return (
    <canvas
      ref={canvasRef}
      data-testid="card-canvas"
      className={className}
      aria-label={`Builder ID card for ${data.name}`}
    />
  );
}
