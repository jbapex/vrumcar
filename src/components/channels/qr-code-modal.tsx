'use client';

import {
  connectChannelInstanceAction,
  syncChannelInstanceStatusAction,
} from '@/app/[orgSlug]/channels/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, Loader2, RefreshCcw } from 'lucide-react';
import type { ChannelInstanceStatus } from '@prisma/client';
import { useEffect, useRef, useState } from 'react';

function toQrDataUrl(base64OrDataUrl: string | null): string | null {
  if (!base64OrDataUrl) return null;
  const s = base64OrDataUrl.trim();
  if (s.startsWith('data:')) return s;
  return `data:image/png;base64,${s}`;
}

function mapConnectUiStatus(
  apiStatus: string,
  hasQr: boolean,
): ChannelInstanceStatus {
  const s = apiStatus.toLowerCase();
  if (s === 'connected') return 'CONNECTED';
  if (hasQr) return 'QR_REQUIRED';
  if (s === 'disconnected') return 'DISCONNECTED';
  return 'CONNECTING';
}

interface Props {
  orgSlug: string;
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrCodeModal({
  orgSlug,
  instanceId,
  open,
  onOpenChange,
}: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ChannelInstanceStatus>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);
    setStatus('CONNECTING');

    connectChannelInstanceAction(orgSlug, instanceId)
      .then((result) => {
        setQrCode(result.qrCode);
        setStatus(mapConnectUiStatus(result.status, Boolean(result.qrCode)));
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao conectar');
        setLoading(false);
      });

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, orgSlug, instanceId]);

  useEffect(() => {
    if (!open || status === 'CONNECTED' || status === 'ERROR') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      void (async () => {
        try {
          const result = await syncChannelInstanceStatusAction(
            orgSlug,
            instanceId,
          );
          setStatus(result.status);
          if (result.qrCode) {
            setQrCode(result.qrCode);
          }
          if (result.status === 'CONNECTED') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            closeTimerRef.current = setTimeout(() => onOpenChange(false), 2000);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      })();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [open, status, orgSlug, instanceId, onOpenChange]);

  const qrSrc = toQrDataUrl(qrCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === 'CONNECTED' ? 'Conectado!' : 'Conectar WhatsApp'}
          </DialogTitle>
          <DialogDescription>
            {status === 'CONNECTED'
              ? 'WhatsApp conectado com sucesso.'
              : 'Abra o WhatsApp no seu celular, vá em Configurações → Dispositivos vinculados → Vincular dispositivo, e escaneie o código abaixo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando QR Code...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {!loading && status === 'CONNECTED' ? (
            <div className="flex flex-col items-center gap-2 text-green-600">
              <CheckCircle2 className="h-16 w-16" />
              <p className="font-medium">Conectado com sucesso!</p>
            </div>
          ) : null}

          {!loading && qrSrc && status !== 'CONNECTED' ? (
            <div className="flex flex-col items-center gap-3">
              {/* Data URL dinâmico do uazapi — next/image não se aplica bem aqui */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="QR Code do WhatsApp"
                className="h-64 w-64 rounded-md border border-zinc-200 dark:border-zinc-700"
              />
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <RefreshCcw className="h-3 w-3 animate-spin" />
                Aguardando scan...
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
