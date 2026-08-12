import { useEffect, useState } from 'react';
import { playMintSound, playStampThud } from '../lib/soundEffects';
import sunriseImg from '../../brand/sunrise.png';
import footerTreesImg from '../../brand/footer-trees.png';

interface MintingTransitionProps {
  photoUrl: string;
  onComplete: () => void;
}

const BEACH_MESSAGES = [
  '🌊 RIDING THE GOA OCEAN WAVES...',
  '☀️ CAPTURING SUNSET SIGNAL...',
  '🌴 STAMPING RESIDENCY PASS...',
  '🏖️ GOA 2026 BUILDER READY!',
];

export default function MintingTransition({ photoUrl, onComplete }: MintingTransitionProps) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    playMintSound();
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % BEACH_MESSAGES.length);
    }, 170);

    const timer = setTimeout(() => {
      playStampThud();
      onComplete();
    }, 700);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-primary/95 backdrop-blur-md animate-goa-sunset px-6 overflow-hidden">
      {/* Tropical Sunrise Backdrop Aura */}
      <img
        src={sunriseImg}
        alt=""
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] max-w-none opacity-30 mix-blend-screen pointer-events-none select-none animate-pulse"
      />

      {/* Footer Palm Trees Silhouette */}
      <img
        src={footerTreesImg}
        alt=""
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[720px] opacity-35 mix-blend-screen pointer-events-none select-none"
      />

      <div className="relative w-64 h-80 rounded-2xl overflow-hidden border-4 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.35)] bg-brand-black/60">
        <img src={photoUrl} alt="" className="w-full h-full object-cover opacity-85" />
        
        {/* Goa Ocean Wave Sweep Bar */}
        <div className="absolute left-0 right-0 h-4 bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 shadow-[0_0_20px_#22d3ee] opacity-80 animate-beach-wave" />

        {/* Tropical Sunburst Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,224,71,0.15),transparent_70%)] pointer-events-none" />
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-ping" />
          <span className="font-body font-bold text-xs uppercase tracking-[0.2em] text-brand-accent">
            {BEACH_MESSAGES[msgIdx]}
          </span>
        </div>
        <p className="font-body text-[10px] uppercase tracking-widest text-brand-offwhite/70">
          Goa 2026 · Less Noise. More Signal.
        </p>
      </div>
    </div>
  );
}

