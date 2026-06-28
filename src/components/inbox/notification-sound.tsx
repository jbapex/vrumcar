'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** Total de mensagens inbound atual (passado pelo server) */
  messageCount: number;
}

/**
 * Componente invisível que toca um som curto quando o
 * messageCount aumenta (nova mensagem recebida).
 *
 * Usa Web Audio API pra gerar um beep simples — sem arquivo
 * MP3 externo.
 */
export function NotificationSound({ messageCount }: Props) {
  const prevCountRef = useRef(messageCount);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      hasInteractedRef.current = true;
    };
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('keydown', handler, { once: true });
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
    };
  }, []);

  useEffect(() => {
    if (messageCount > prevCountRef.current && hasInteractedRef.current) {
      playNotificationBeep();
    }
    prevCountRef.current = messageCount;
  }, [messageCount]);

  return null;
}

function playNotificationBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 880;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    oscillator.onended = () => ctx.close();
  } catch (err) {
    console.warn('Notification sound failed:', err);
  }
}
