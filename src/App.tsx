import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import logo from '../brand/logo.png';
import goaBadge from '../brand/goa-badge.svg';
import studioMark from '../brand/studio-mark.svg';
import sunriseImg from '../brand/sunrise.png';
import footerTreesImg from '../brand/footer-trees.png';
import PhotoUpload from './components/PhotoUpload';
import CropCanvas from './components/CropCanvas';
import BuilderForm from './components/BuilderForm';
import BuilderCardCanvas from './components/BuilderCardCanvas';
import ShareActions from './components/ShareActions';
import MintingTransition from './components/MintingTransition';
import { DEFAULT_CROP, loadImageFromFile, type CropTransform } from './lib/canvasUtils';
import { makeSerial, pickBuilderTitle } from './lib/builderTitles';
import { cardToBlob, preloadCardAssets, type CardPhoto } from './lib/renderCard';
import { isAudioMuted, toggleAudio, playClick } from './lib/soundEffects';

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
  const [format, setFormat] = useState<'id' | 'pfp'>('id');
  const [theme, setTheme] = useState<'forest' | 'sunrise' | 'cyber' | 'vintage'>('forest');
  const [stickers, setStickers] = useState<string[]>(['SHIP OR SHIP']);
  const [stage, setStage] = useState<'build' | 'minting' | 'result'>('build');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioMuted, setAudioMutedState] = useState(isAudioMuted());
  const [showEasterEgg, setShowEasterEgg] = useState(false);
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
      playClick();
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
    () => ({ name: displayName, role: displayRole, title, serial, format, theme, stickers }),
    [displayName, displayRole, title, serial, format, theme, stickers],
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

  const handleStartGenerate = () => {
    playClick();
    setStage('minting');
  };

  const handleMintingComplete = useCallback(() => {
    setStage('result');
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  const startOver = () => {
    playClick();
    setStage('build');
    setBlob(null);
  };

  const handleStickerToggle = (st: string) => {
    setStickers((prev) => {
      if (prev.includes(st)) {
        return prev.filter((s) => s !== st);
      }
      if (prev.length >= 2) {
        return [prev[1], st];
      }
      return [...prev, st];
    });
  };

  const handleSoundToggle = () => {
    const isMuted = toggleAudio();
    setAudioMutedState(isMuted);
    if (!isMuted) playClick();
  };

  const fileName = `frame247-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'builder'}.png`;
  const caption = `${displayName} · ${title}\n${CAPTION_SUFFIX}`;

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col relative transition-colors duration-300 overflow-x-hidden">
      {/* Background Sunrise Atmosphere Glow */}
      <img
        src={sunriseImg}
        alt=""
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] max-w-none opacity-25 mix-blend-screen pointer-events-none select-none -z-0"
      />

      {/* Sound Toggle Floating Button */}
      <button
        type="button"
        onClick={handleSoundToggle}
        className="fixed top-4 right-4 z-40 bg-brand-black/40 hover:bg-brand-black/60 border border-brand-accent/30 text-brand-accent rounded-full p-2.5 backdrop-blur-md transition-all active:scale-95"
        title={audioMuted ? 'Unmute Audio SFX' : 'Mute Audio SFX'}
      >
        <span className="text-xs font-mono">{audioMuted ? '🔇 Muted' : '🔊 Audio'}</span>
      </button>

      <header className="flex flex-col items-center px-5 pt-10 pb-6 text-center relative z-10">
        <Wordmark className="w-full max-w-[420px]" />
        <p className="mt-5 font-body font-semibold uppercase tracking-[0.28em] text-brand-accent text-[11px] sm:text-xs">
          Goa, India &nbsp;·&nbsp; 28–31 Oct 2026
        </p>
        <div className="mt-4 h-[3px] w-16 bg-brand-pink" />
        <h1 className="mt-4 font-heading text-brand-white text-3xl sm:text-4xl leading-none">
          Less Noise. More Signal.
        </h1>
        <p className="mt-2 font-body text-brand-offwhite/60 text-[11px] uppercase tracking-[0.14em]">
          Frame247 — build your Builder ID & Frame
        </p>
      </header>

      <main className="flex-1 w-full max-w-[420px] mx-auto px-5 pb-16 flex flex-col gap-6">
        {error && (
          <p className="font-body text-brand-pink text-xs text-center" role="alert">
            {error}
          </p>
        )}

        {stage === 'minting' && photo && (
          <MintingTransition photoUrl={photo.url} onComplete={handleMintingComplete} />
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
                    aspect={format === 'pfp' ? 1 : 4 / 5}
                    width={280}
                    transform={transform}
                    onTransformChange={setTransform}
                  />
                  <button
                    type="button"
                    data-testid="choose-different-photo"
                    onClick={() => {
                      playClick();
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
                  format={format}
                  theme={theme}
                  stickers={stickers}
                  onNameChange={setName}
                  onRoleChange={setRole}
                  onReroll={() => setReroll((r) => r + 1)}
                  onFormatChange={setFormat}
                  onThemeChange={setTheme}
                  onStickerToggle={handleStickerToggle}
                />

                <button
                  type="button"
                  data-testid="generate-btn"
                  onClick={handleStartGenerate}
                  disabled={!canGenerate}
                  className="w-full font-body font-bold uppercase tracking-[0.16em] text-[13px] rounded-md px-5 py-4 bg-brand-accent text-brand-primary hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-lg shadow-brand-accent/10"
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
              className="font-body text-[10px] uppercase tracking-wider text-brand-offwhite/50 hover:text-brand-accent underline underline-offset-2 transition-colors text-center"
            >
              Edit details
            </button>
          </div>
        )}
      </main>

      <footer className="relative flex flex-col items-center justify-center pt-8 pb-6 px-5 opacity-90 overflow-hidden">
        <img
          src={footerTreesImg}
          alt=""
          className="w-full max-w-[580px] h-auto opacity-30 mix-blend-screen pointer-events-none select-none mb-3"
        />
        <button
          type="button"
          onClick={() => {
            playClick();
            setShowEasterEgg(true);
          }}
          className="flex items-center gap-2 group cursor-pointer hover:opacity-100 transition-opacity z-10"
        >
          <img src={studioMark} alt="" className="h-4 w-auto group-hover:scale-110 transition-transform" draggable={false} />
          <span className="font-body font-semibold uppercase tracking-[0.2em] text-brand-accent text-[10px] group-hover:underline">
            2:47 PM Studio
          </span>
        </button>
      </footer>

      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-brand-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-primary border-2 border-brand-accent rounded-xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl relative">
            <div className="h-10 w-10 rounded-full bg-brand-pink flex items-center justify-center text-brand-white text-xl">
              ⚡
            </div>
            <h3 className="font-heading text-2xl text-brand-white">2:47 PM Studio</h3>
            <p className="font-body text-xs text-brand-offwhite/80 leading-relaxed">
              &quot;4 days. 247 builders. heads down. ship or ship.&quot;
            </p>
            <p className="font-body text-[10px] text-brand-accent uppercase tracking-widest">
              Hacker House Goa 2026 Edition
            </p>
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowEasterEgg(false);
              }}
              className="mt-2 w-full font-body font-bold text-xs uppercase tracking-wider py-2.5 rounded-md bg-brand-accent text-brand-primary hover:opacity-90 transition-opacity"
            >
              Close Signal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

