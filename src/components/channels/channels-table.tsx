'use client';

import {
  deleteChannelInstanceAction,
  syncChannelInstanceStatusAction,
} from '@/app/[orgSlug]/channels/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPhone } from '@/lib/format/phone';
import type { ChannelInstance } from '@prisma/client';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { InstanceStatusBadge } from './instance-status-badge';
import { QrCodeModal } from './qr-code-modal';

interface Props {
  orgSlug: string;
  instances: ChannelInstance[];
}

export function ChannelsTable({ orgSlug, instances }: Props) {
  const router = useRouter();
  const [qrInstanceId, setQrInstanceId] = useState<string | null>(null);
  const [deleteInstance, setDeleteInstance] = useState<ChannelInstance | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleConnect = (instanceId: string) => {
    setQrInstanceId(instanceId);
  };

  const handleSync = (instanceId: string) => {
    startTransition(async () => {
      try {
        await syncChannelInstanceStatusAction(orgSlug, instanceId);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteInstance) return;
    startTransition(async () => {
      try {
        await deleteChannelInstanceAction(orgSlug, deleteInstance.id);
        setDeleteInstance(null);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  const hasOffline = instances.some((i) => i.status !== 'CONNECTED');

  return (
    <>
      {hasOffline ? (
        <p className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          Canais offline precisam ser reconectados para receber mensagens.
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Dispositivo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance) => (
              <tr
                key={instance.id}
                className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span className="font-medium">{instance.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  WhatsApp Starter
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {instance.phoneNumber
                    ? formatPhone(instance.phoneNumber) || instance.phoneNumber
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <InstanceStatusBadge status={instance.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {instance.status !== 'CONNECTED' ? (
                      <button
                        type="button"
                        onClick={() => handleConnect(instance.id)}
                        disabled={isPending}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Reconectar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleSync(instance.id)}
                      disabled={isPending}
                      className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800"
                      title="Sincronizar status"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteInstance(instance)}
                      disabled={isPending}
                      className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrInstanceId ? (
        <QrCodeModal
          orgSlug={orgSlug}
          instanceId={qrInstanceId}
          open={Boolean(qrInstanceId)}
          onOpenChange={(open) => {
            if (!open) setQrInstanceId(null);
          }}
        />
      ) : null}

      <Dialog
        open={Boolean(deleteInstance)}
        onOpenChange={(open) => {
          if (!open) setDeleteInstance(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir canal?</DialogTitle>
            <DialogDescription>
              Isso vai desconectar o WhatsApp e remover a instância. Conversas
              existentes ficam no histórico mas novas mensagens não chegam mais.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteInstance(null)}
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
    </>
  );
}
