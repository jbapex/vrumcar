'use client';

import { Loader2, Volume2 } from 'lucide-react';
import { LazyMedia } from './lazy-media';

interface Props {
  orgSlug: string;
  messageId: string;
  initialUrl: string | null;
  initialMimeType: string | null;
  sizeBytes?: number | null;
  fileName?: string | null;
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AudioMessage({
  orgSlug,
  messageId,
  initialUrl,
  initialMimeType,
  sizeBytes,
  fileName,
}: Props) {
  return (
    <LazyMedia
      orgSlug={orgSlug}
      messageId={messageId}
      initialUrl={initialUrl}
      initialMimeType={initialMimeType}
    >
      {({ url, loading, error }) => (
        <div className="min-w-[240px]">
          {loading && (
            <div className="flex items-center gap-2 rounded-md bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando áudio…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
              <Volume2 className="h-4 w-4" />
              Falha ao carregar
            </div>
          )}
          {url && !loading && (
            <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-800/80">
              <audio controls src={url} className="w-full max-w-xs">
                Seu navegador não suporta áudio.
              </audio>
              {(fileName || sizeBytes) && (
                <p className="mt-1 text-[10px] opacity-70">
                  {fileName ?? 'audio'}{' '}
                  {sizeBytes ? `· ${formatSize(sizeBytes)}` : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </LazyMedia>
  );
}
