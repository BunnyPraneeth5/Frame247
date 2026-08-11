import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import logo from '../brand/logo.png';
import goaBadge from '../brand/goa-badge.svg';
import studioMark from '../brand/studio-mark.svg';
import PhotoUpload from './components/PhotoUpload';
import CropCanvas from './components/CropCanvas';
import BuilderForm from './components/BuilderForm';
import BuilderCardCanvas from './components/BuilderCardCanvas';
import ShareActions from './components/ShareActions';
import { DEFAULT_CROP, loadImageFromFile, type CropTransform } from './lib/canvasUtils';
import { makeSerial, pickBuilderTitle } from './lib/builderTitles';
import { cardToBlob, preloadCardAssets, type CardPhoto } from './lib/renderCard';

interface LoadedPhoto {
  img: HTMLImageElement;
  url: string;
  w: number;
  h: number;
}

const CAPTION_SUFFIX =
  'Just minted my Hacker House Goa 2026 Builder ID. Less noise, more signal. #FrameInGoa';

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <img src={logo} alt="Hacker House" className="w-full select-none" draggable={false} />
      <img
        src={goaBadge}
        alt="गोवा"
        // Ratios match the live site's own wordmark/badge lockup.
        className="absolute select-none -translate-x-1/2 -translate-y-1/2"
        style={{ width: '13.25%', left: '50%', top: '46.34%' }}
        draggable={false}
      />
    </div>
  );
}

export default function App() {
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  const [transform, setTransform] = useState<CropTransform>(DEFAULT_CROP);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [reroll, setReroll] = useState(0);
  const [stage, setStage] = useState<'build' | 'result'>('build');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    preloadCardAssets();
  }, []);

  // Revoke the previous object URL when the photo is replaced or cleared.
  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);

  const handlePhotoReady = useCallback(async (file: File) => {
    setError(null);
    try {
      const { img, url, width, height } = await loadImageFromFile(file);
      // The cleanup effect keyed on `photo` revokes the previous URL.
      setPhoto({ img, url, w: width, h: height });
      setTransform(DEFAULT_CROP);
    } catch {
      setError('Could not read that photo. Try a different file.');
    }
  }, []);

  const displayName = name.trim() || 'YOUR NAME';
  const displayRole = role.trim() || 'BUILDER';
  const title = useMemo(
    () => pickBuilderTitle(displayName, displayRole, reroll),
    [displayName, displayRole, reroll],
  );
  const serial = useMemo(() => makeSerial(displayName), [displayName]);

  const cardData = useMemo(
    () => ({ name: displayName, role: displayRole, title, serial }),
    [displayName, displayRole, title, serial],
  );

  const cardPhoto: CardPhoto | null = useMemo(
    () => (photo ? { img: photo.img, imgW: photo.w, imgH: photo.h, transform } : null),
    [photo, transform],
  );

  const handleRendered = useCallback((canvas: HTMLCanvasElement) => {
    cardToBlob(canvas)
      .then(setBlob)
      .catch(() => setError('Could not export the card as a PNG.'));
  }, []);

  const canGenerate = !!photo && name.trim().length > 0 && role.trim().length > 0;

  const generate = () => {
    setStage('result');
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const startOver = () => {
    setStage('build');
    setBlob(null);
  };

  const fileName = `frame247-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'builder'}.png`;
  const caption = `${displayName} · ${title}\n${CAPTION_SUFFIX}`;

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col">
      <header className="flex flex-col items-center px-5 pt-10 pb-6 text-center">
        <Wordmark className="w-full max-w-[420px]" />
        <p className="mt-5 font-body font-semibold uppercase tracking-[0.28em] text-brand-accent text-[11px] sm:text-xs">
          Goa, India &nbsp;·&nbsp; 28–31 Oct 2026
        </p>
        <div className="mt-4 h-[3px] w-16 bg-brand-pink" />
        <h1 className="mt-4 font-heading text-brand-white text-3xl sm:text-4xl leading-none">
          Less Noise. More Signal.
        </h1>
        <p className="mt-2 font-body text-brand-offwhite/60 text-[11px] uppercase tracking-[0.14em]">
          Frame247 — build your Builder ID
        </p>
      </header>

      <main className="flex-1 w-full max-w-[420px] mx-auto px-5 pb-16 flex flex-col gap-6">
        {error && (
          <p className="font-body text-brand-pink text-xs text-center" role="alert">
            {error}
          </p>
        )}

        {stage === 'build' && (
          <>
            {!photo && (
              <div className="flex justify-center">
                <PhotoUpload onPhotoReady={handlePhotoReady} />
              </div>
            )}

            {photo && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <CropCanvas
                    image={photo.img}
                    imgW={photo.w}
                    imgH={photo.h}
                    aspect={4 / 5}
                    width={280}
                    transform={transform}
                    onTransformChange={setTransform}
                  />
                  <button
                    type="button"
                    data-testid="choose-different-photo"
                    onClick={() => {
                      setPhoto(null);
                      setBlob(null);
                    }}
                    className="font-body text-[10px] uppercase tracking-wider text-brand-offwhite/50 hover:text-brand-accent underline underline-offset-2 transition-colors"
                  >
                    Choose a different photo
                  </button>
                </div>

                <div className="h-px w-full bg-brand-accent/20" />

                <BuilderForm
                  name={name}
                  role={role}
                  title={title}
                  onNameChange={setName}
                  onRoleChange={setRole}
                  onReroll={() => setReroll((r) => r + 1)}
                />

                <button
                  type="button"
                  data-testid="generate-btn"
                  onClick={generate}
                  disabled={!canGenerate}
                  className="w-full font-body font-bold uppercase tracking-[0.16em] text-[13px] rounded-md px-5 py-4 bg-brand-accent text-brand-primary hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed transition-opacity"
                >
                  Generate my ID
                </button>
                {!canGenerate && (
                  <p className="font-body text-brand-offwhite/40 text-[10px] text-center -mt-3">
                    Add your name and stack to continue
                  </p>
                )}
              </>
            )}
          </>
        )}

        {stage === 'result' && cardPhoto && (
          <div ref={resultRef} className="flex flex-col gap-5">
            <BuilderCardCanvas
              data={cardData}
              photo={cardPhoto}
              onRendered={handleRendered}
              onError={setError}
              className="card-reveal w-full h-auto rounded-lg shadow-[6px_8px_0_rgba(0,0,0,0.3)]"
            />
            <ShareActions blob={blob} fileName={fileName} caption={caption} />
            <button
              type="button"
              data-testid="back-btn"
              onClick={startOver}
              className="font-body text-[10px] uppercase tracking-wider text-brand-offwhite/50 hover:text-brand-accent underline underline-offset-2 transition-colors"
            >
              Edit details
            </button>
          </div>
        )}
      </main>

      <footer className="flex items-center justify-center gap-2 px-5 py-5 opacity-60">
        <img src={studioMark} alt="" className="h-4 w-auto" draggable={false} />
        <span className="font-body font-semibold uppercase tracking-[0.2em] text-brand-accent text-[10px]">
          2:47 PM Studio
        </span>
      </footer>
    </div>
  );
}
