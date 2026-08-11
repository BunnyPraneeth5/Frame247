import { useState } from 'react';

interface ShareActionsProps {
  blob: Blob | null;
  fileName: string;
  caption: string;
}

const btnBase =
  'w-full font-body font-bold uppercase tracking-[0.14em] text-[12px] rounded-md px-5 py-3.5 transition-colors';

export default function ShareActions({ blob, fileName, caption }: ShareActionsProps) {
  const [note, setNote] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const download = () => {
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

  const openTweetIntent = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToX = async () => {
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
        className={`${btnBase} bg-brand-accent text-brand-primary hover:opacity-90 disabled:opacity-40`}
      >
        Download PNG
      </button>
      <button
        type="button"
        data-testid="share-btn"
        onClick={shareToX}
        disabled={!blob}
        className={`${btnBase} bg-brand-pink text-brand-white hover:opacity-90 disabled:opacity-40`}
      >
        Share to X
      </button>
      {note && (
        <p className="font-body text-brand-accent text-[11px] leading-snug text-center" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
