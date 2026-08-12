import { useState } from 'react';
import { playClick } from '../lib/soundEffects';

interface ShareActionsProps {
  blob: Blob | null;
  fileName: string;
  caption: string;
}

const btnBase =
  'w-full font-body font-bold uppercase tracking-[0.14em] text-[12px] rounded-md px-5 py-3.5 transition-all active:scale-[0.99]';

export default function ShareActions({ blob, fileName, caption }: ShareActionsProps) {
  const [note, setNote] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const download = () => {
    playClick();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick — revoking synchronously can cancel the download in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setDownloaded(true);
    setNote(null);
  };

  const copyImage = async () => {
    playClick();
    if (!blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setNote('PNG image copied to clipboard! Ready to paste into X, Discord, or Telegram.');
        setTimeout(() => setCopied(false), 3000);
      } else {
        setNote('Copy image is not supported on this browser — use Download instead.');
      }
    } catch {
      setNote('Could not copy image automatically. Use Download PNG.');
    }
  };

  const openTweetIntent = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToX = async () => {
    playClick();
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });

    // Primary path: native share sheet with the image actually attached.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
        setNote(null);
        return;
      } catch (err) {
        // User dismissing the sheet is not an error worth surfacing.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    // Fallback: download the PNG, then open X with the caption pre-filled so the
    // user only has to attach the file that just landed in their downloads.
    if (!downloaded) download();
    openTweetIntent();
    setNote('Caption is pre-filled on X — attach the PNG that just downloaded.');
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      <button
        type="button"
        data-testid="download-btn"
        onClick={download}
        disabled={!blob}
        className={`${btnBase} bg-brand-accent text-brand-primary hover:opacity-90 disabled:opacity-40 shadow-sm`}
      >
        Download PNG
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="share-btn"
          onClick={shareToX}
          disabled={!blob}
          className={`${btnBase} bg-brand-pink text-brand-white hover:opacity-90 disabled:opacity-40 shadow-sm`}
        >
          Share to X
        </button>

        <button
          type="button"
          onClick={copyImage}
          disabled={!blob}
          className={`${btnBase} bg-brand-white/15 text-brand-offwhite hover:bg-brand-white/25 border border-brand-accent/30 disabled:opacity-40`}
        >
          {copied ? '✓ Copied!' : '📋 Copy PNG'}
        </button>
      </div>

      {note && (
        <p className="font-body text-brand-accent text-[11px] leading-snug text-center" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

