'use client';

import {
  deleteChannelInstanceAction,
  syncChannelInstanceStatusAction,
} from '@/app/[orgSlug]/channels/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ChannelInstance } from '@prisma/client';
import { Link2, MessageCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChannelStatusBadge } from './channel-status-badge';
import { QrCodeModal } from './qr-code-modal';

interface Props {
  orgSlug: string;
  instance: ChannelInstance;
}

export function ChannelCard({ orgSlug, instance }: Props) {
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canConnect = ['PENDING', 'DISCONNECTED', 'ERROR'].includes(
    instance.status,
  );
  const canShowQr = instance.status === 'QR_REQUIRED';

  const handleSync = () => {
    startTransition(async () => {
      try {
        await syncChannelInstanceStatusAction(orgSlug, instance.id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteChannelInstanceAction(orgSlug, instance.id);
        setDeleteOpen(false);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-md bg-green-100 p-2 text-green-700 dark:bg-green-950/50 dark:text-green-400">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">{instance.name}</CardTitle>
                {instance.phoneNumber ? (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    +{instance.phoneNumber}
                  </p>
                ) : null}
              </div>
            </div>
            <ChannelStatusBadge status={instance.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {canConnect ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setQrOpen(true)}
                disabled={isPending}
              >
                <Link2 className="mr-2 h-3 w-3" />
                Conectar
              </Button>
            ) : null}
            {canShowQr ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setQrOpen(true)}
                disabled={isPending}
              >
                Ver QR Code
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isPending}
            >
              <RefreshCw
                className={`mr-2 h-3 w-3 ${isPending ? 'animate-spin' : ''}`}
              />
              Sincronizar
            </Button>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Excluir
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Excluir canal?</DialogTitle>
                  <DialogDescription>
                    Isso vai desconectar o WhatsApp e remover a instância.
                    Conversas existentes ficam no histórico mas novas mensagens
                    não chegam mais.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    {isPending ? 'Excluindo...' : 'Confirmar exclusão'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {instance.lastError ? (
            <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {instance.lastError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <QrCodeModal
        orgSlug={orgSlug}
        instanceId={instance.id}
        open={qrOpen}
        onOpenChange={setQrOpen}
      />
    </>
  );
}
