'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Componente invisível que fica chamando router.refresh() a cada
 * intervalo, fazendo a página Server Component recarregar e mostrar
 * dados novos.
 *
 * Solução simples (polling) em vez de SSE/WebSocket. Trade-off:
 * pequena latência (~3s) e algum overhead de query, mas é robusto
 * e funciona em qualquer hosting.
 */
interface Props {
  intervalMs?: number;
}

export function InboxPoller({ intervalMs = 3000 }: Props) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router, intervalMs]);

  return null;
}
