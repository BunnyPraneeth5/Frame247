import { useState } from 'react';
import { playClick } from '../lib/soundEffects';

interface ShareActionsProps {
  blob: Blob | null;
  fileName: string;
  caption: string;
}

const btnBase =
  'w-full font-body font-bold uppercase tracking-[0.14em] text-[12px] rounded-md px-4 py-3.5 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed';

export default function ShareActions({ blob, fileName, caption }: ShareActionsProps) {
  const [note, setNote] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const download = (): boolean => {
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setDownloaded(true);
    return true;
  };

  const handleDownloadClick = () => {
    playClick();
    if (download()) {
      setNote('✅ Pass PNG downloaded to your device!');
    }
  };

  const copyImage = async () => {
    playClick();
    if (!blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setNote('📋 PNG image copied to clipboard! Ready to paste into X, LinkedIn, Discord or Telegram.');
        setTimeout(() => setCopied(false), 3000);
      } else {
        await navigator.clipboard.writeText(caption);
        setNote('📋 Caption text copied to clipboard!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(caption);
        setNote('📋 Caption text copied to clipboard!');
      } catch {
        setNote('Copy not fully supported on this browser — use Download instead.');
      }
    }
  };

  const shareToX = async () => {
    playClick();
    if (!blob) return;

    const file = new File([blob], fileName, { type: 'image/png' });

    // Primary path on mobile browsers with native share
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
        setNote(null);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    // Direct redirect path to X intent composer
    if (!downloaded) download();
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    setNote('𝕏 Opening X! Caption pre-filled — attach the downloaded PNG pass.');
  };

  const shareToLinkedIn = async () => {
    playClick();
    if (!blob) return;

    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption, title: 'HHGoa 2026 Builder ID' });
        setNote(null);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    // Direct redirect path to LinkedIn post composer
    if (!downloaded) download();

    // Copy caption text so user can easily paste into LinkedIn
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(caption);
      }
    } catch {
      // Ignore clipboard write failures
    }

    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    setNote('💼 Opening LinkedIn! Caption pre-filled — attach your downloaded pass PNG.');
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="bg-brand-black/30 border border-brand-accent/30 rounded-lg p-3 text-center">
        <p className="font-body text-xs uppercase tracking-widest text-brand-accent font-bold mb-0.5">
          🚀 Pass Ready! Redirect & Share
        </p>
        <p className="font-body text-[11px] text-brand-offwhite/60">
          Redirects directly to X or LinkedIn post composer with pre-filled caption
        </p>
      </div>

      {/* Primary Social Redirects Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="share-btn"
          onClick={shareToX}
          disabled={!blob}
          className={`${btnBase} bg-black text-brand-white border border-brand-pink/50 hover:bg-brand-pink hover:border-brand-pink shadow-md`}
        >
          <span className="text-sm font-bold">𝕏</span>
          <span>Post to X</span>
        </button>

        <button
          type="button"
          data-testid="share-linkedin-btn"
          onClick={shareToLinkedIn}
          disabled={!blob}
          className={`${btnBase} bg-[#0A66C2] text-white hover:bg-[#084e96] shadow-md`}
        >
          <span className="text-sm">💼</span>
          <span>LinkedIn</span>
        </button>
      </div>

      {/* Secondary Download & Copy Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="download-btn"
          onClick={handleDownloadClick}
          disabled={!blob}
          className={`${btnBase} bg-brand-accent text-brand-primary hover:opacity-90 disabled:opacity-40 shadow-sm`}
        >
          <span>📥</span>
          <span>Download PNG</span>
        </button>

        <button
          type="button"
          onClick={copyImage}
          disabled={!blob}
          className={`${btnBase} bg-brand-white/15 text-brand-offwhite hover:bg-brand-white/25 border border-brand-accent/30 disabled:opacity-40`}
        >
          <span>{copied ? '✓' : '📋'}</span>
          <span>{copied ? 'Copied!' : 'Copy PNG'}</span>
        </button>
      </div>

      {note && (
        <p className="font-body text-brand-accent text-[11px] leading-snug text-center p-2 rounded bg-brand-black/20 border border-brand-accent/20 animate-fade-in" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

