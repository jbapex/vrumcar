'use client';

import { ImageOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { LazyMedia } from './lazy-media';

interface Props {
  orgSlug: string;
  messageId: string;
  initialUrl: string | null;
  initialMimeType: string | null;
  caption?: string | null;
}

export function ImageMessage({
  orgSlug,
  messageId,
  initialUrl,
  initialMimeType,
  caption,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <LazyMedia
      orgSlug={orgSlug}
      messageId={messageId}
      initialUrl={initialUrl}
      initialMimeType={initialMimeType}
    >
      {({ url, loading, error }) => (
        <>
          <div className="relative max-w-xs">
            {loading && (
              <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-md bg-zinc-200 dark:bg-zinc-700">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                <span className="text-xs text-zinc-600 dark:text-zinc-300">
                  Carregando imagem…
                </span>
              </div>
            )}
            {error && (
              <div className="flex h-48 w-48 flex-col items-center justify-center rounded-md bg-red-50 p-3 text-center dark:bg-red-950/40">
                <ImageOff className="h-6 w-6 text-red-400" />
                <p className="mt-2 text-xs text-red-700 dark:text-red-200">
                  Falha ao carregar imagem
                </p>
              </div>
            )}
            {url && !loading && (
              // eslint-disable-next-line @next/next/no-img-element -- URL pública MinIO/uazapi
              <img
                src={url}
                alt={caption ?? 'Imagem'}
                className="max-h-64 w-auto cursor-pointer rounded-md object-cover"
                onClick={() => setLightboxOpen(true)}
              />
            )}
            {caption && url && !loading && !error ? (
              <p className="mt-1 text-xs opacity-80">{caption}</p>
            ) : null}
          </div>

          {lightboxOpen && url ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
              onClick={() => setLightboxOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setLightboxOpen(false);
              }}
              role="presentation"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={caption ?? 'Imagem'}
                className="max-h-[90vh] max-w-[90vw] rounded-md"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                ✕
              </button>
            </div>
          ) : null}
        </>
      )}
    </LazyMedia>
  );
}
