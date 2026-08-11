import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { convertHeicToJpeg, isHeic } from '../lib/heicConvert';

const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const MAX_SIZE_MB = 25;

interface PhotoUploadProps {
  onPhotoReady: (file: File) => void;
}

export default function PhotoUpload({ onPhotoReady }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    const name = file.name.toLowerCase();
    const validExt = ACCEPTED_EXT.some((ext) => name.endsWith(ext));
    const validMime = file.type.startsWith('image/');
    if (!validExt && !validMime) {
      setError('Unsupported file type. Use JPG, PNG, WebP, or HEIC.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`That file is too large (max ${MAX_SIZE_MB}MB).`);
      return;
    }

    try {
      if (isHeic(file)) {
        setConverting(true);
        const converted = await convertHeicToJpeg(file);
        setConverting(false);
        onPhotoReady(converted);
      } else {
        onPhotoReady(file);
      }
    } catch {
      setConverting(false);
      setError('Could not process that photo. Try a different file.');
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragActive ? 'border-brand-pink bg-brand-white/5' : 'border-brand-accent/50'
        }`}
      >
        <p className="font-body font-semibold uppercase tracking-wide text-brand-accent text-sm">
          {converting ? 'Converting HEIC…' : 'Tap or drop a photo'}
        </p>
        <p className="mt-1 font-body text-brand-offwhite/60 text-xs">
          JPG, PNG, WebP, or HEIC — up to {MAX_SIZE_MB}MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={onInputChange}
      />
      {error && <p className="mt-2 font-body text-brand-pink text-sm" role="alert">{error}</p>}
    </div>
  );
}
