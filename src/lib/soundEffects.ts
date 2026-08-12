/**
 * Zero-dependency Web Audio API synthesizer for interactive audio delight.
 * Safe across browsers with mute state stored in localStorage.
 */

let audioCtx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('frame247_sound') === 'off';
} catch {
  // localStorage disabled or unavailable
}

function getContext(): AudioContext | null {
  if (muted) return null;
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioMuted(): boolean {
  return muted;
}

export function setAudioMuted(mute: boolean): void {
  muted = mute;
  try {
    localStorage.setItem('frame247_sound', mute ? 'off' : 'on');
  } catch {
    // ignore
  }
}

export function toggleAudio(): boolean {
  setAudioMuted(!muted);
  return muted;
}

/** Subtle high tick for UI button presses */
export function playClick(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Audio execution fallback
  }
}

/** Playful ascending arpeggio when rerolling titles */
export function playReroll(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.035;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.07);
    });
  } catch {
    // Audio execution fallback
  }
}

/** Tropical ocean wave swell sound for Goa Beach transition */
export function playBeachWaveSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.35);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.65);
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch {
    // Audio execution fallback
  }
}

/** Pass printer sweep sound when minting card */
export function playMintSound(): void {
  playBeachWaveSound();
}

/** Heavy bass impact thud for "Verified Builder" stamp completion */
export function playStampThud(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Audio execution fallback
  }
}
