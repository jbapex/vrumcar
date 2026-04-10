'use client';

import { Download, FileText, Loader2 } from 'lucide-react';
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

export function DocumentMessage({
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
              Carregando documento…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
              <FileText className="h-4 w-4" />
              Falha ao carregar
            </div>
          )}
          {url && !loading && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download={fileName ?? undefined}
              className="flex items-center gap-3 rounded-md bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800"
            >
              <FileText className="h-8 w-8 shrink-0 text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {fileName ?? 'Documento'}
                </p>
                {sizeBytes ? (
                  <p className="text-xs opacity-70">{formatSize(sizeBytes)}</p>
                ) : null}
              </div>
              <Download className="h-4 w-4 shrink-0 text-zinc-500" />
            </a>
          )}
        </div>
      )}
    </LazyMedia>
  );
}
