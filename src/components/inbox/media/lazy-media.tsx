'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  orgSlug: string;
  messageId: string;
  initialUrl: string | null;
  initialMimeType: string | null;
  children: (state: {
    url: string | null;
    loading: boolean;
    error: string | null;
    mimeType: string | null;
  }) => ReactNode;
}

/**
 * Wrapper que dispara o download da mídia se ainda não tiver URL.
 * Usa render-props pra deixar os filhos decidirem como renderizar.
 *
 * Uma vez que url é definida (cache hit ou download terminado),
 * fica fixa.
 */
export function LazyMedia({
  orgSlug,
  messageId,
  initialUrl,
  initialMimeType,
  children,
}: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [mimeType, setMimeType] = useState<string | null>(initialMimeType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (url) return;
    if (triggered.current) return;
    triggered.current = true;

    setLoading(true);
    fetch(`/api/${orgSlug}/messages/${messageId}/download`)
      .then(async (resp) => {
        if (!resp.ok) {
          const data = (await resp.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? `HTTP ${resp.status}`);
        }
        return resp.json() as Promise<{
          url: string;
          mimeType: string | null;
        }>;
      })
      .then((data) => {
        setUrl(data.url);
        setMimeType(data.mimeType);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url, orgSlug, messageId]);

  return <>{children({ url, loading, error, mimeType })}</>;
}
