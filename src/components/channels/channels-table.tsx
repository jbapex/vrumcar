'use client';

import {
  deleteChannelInstanceAction,
  syncChannelInstanceStatusAction,
} from '@/app/[orgSlug]/channels/actions';
import {
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableHeadCell,
  ListTableHeader,
  ListTableRow,
  ListTableWrap,
} from '@/components/layout/list-table';
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
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { cn } from '@/lib/utils';
import type { ChannelInstance } from '@prisma/client';
import { RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { InstanceStatusBadge } from './instance-status-badge';
import { QrCodeModal } from './qr-code-modal';

interface Props {
  orgSlug: string;
  instances: ChannelInstance[];
}

function connectButtonLabel(instance: ChannelInstance): string {
  const neverConnected =
    !instance.lastConnectedAt && !instance.phoneNumber;
  if (
    neverConnected ||
    instance.status === 'PENDING' ||
    instance.status === 'QR_REQUIRED'
  ) {
    return 'Conectar';
  }
  return 'Reconectar';
}

export function ChannelsTable({ orgSlug, instances }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [qrInstanceId, setQrInstanceId] = useState<string | null>(null);
  const [deleteInstance, setDeleteInstance] = useState<ChannelInstance | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const targetId = searchParams.get('connect');
    if (!targetId) return;
    if (!instances.some((i) => i.id === targetId)) return;

    setQrInstanceId(targetId);
    router.replace(`/${orgSlug}/channels`, { scroll: false });
  }, [searchParams, instances, orgSlug, router]);

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
        <p className="border-b border-border/50 bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground md:px-5">
          Canais offline precisam ser reconectados para receber mensagens.
        </p>
      ) : null}

      <ListTableWrap>
        <ListTable>
          <ListTableHeader>
            <ListTableHeadCell>Nome</ListTableHeadCell>
            <ListTableHeadCell>Tipo</ListTableHeadCell>
            <ListTableHeadCell>Dispositivo</ListTableHeadCell>
            <ListTableHeadCell>Status</ListTableHeadCell>
            <ListTableHeadCell className="text-right">Ações</ListTableHeadCell>
          </ListTableHeader>
          <ListTableBody>
            {instances.map((instance) => (
              <ListTableRow key={instance.id}>
                <ListTableCell>
                  <div className="flex items-center gap-2">
                    <Smartphone
                      className="size-4 shrink-0 text-muted-foreground"
                      strokeWidth={LUCIDE_STROKE_THIN}
                      aria-hidden
                    />
                    <span className="font-medium">{instance.name}</span>
                  </div>
                </ListTableCell>
                <ListTableCell className="text-muted-foreground">
                  WhatsApp Starter
                </ListTableCell>
                <ListTableCell className="text-muted-foreground">
                  {instance.phoneNumber
                    ? formatPhone(instance.phoneNumber) || instance.phoneNumber
                    : '—'}
                </ListTableCell>
                <ListTableCell>
                  <InstanceStatusBadge status={instance.status} />
                </ListTableCell>
                <ListTableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {instance.status !== 'CONNECTED' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => handleConnect(instance.id)}
                        disabled={isPending}
                      >
                        {connectButtonLabel(instance)}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleSync(instance.id)}
                      disabled={isPending}
                      title="Sincronizar status"
                      className="text-muted-foreground"
                    >
                      <RefreshCw
                        className={cn('size-4', isPending && 'animate-spin')}
                        strokeWidth={LUCIDE_STROKE_THIN}
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteInstance(instance)}
                      disabled={isPending}
                      title="Remover"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2
                        className="size-4"
                        strokeWidth={LUCIDE_STROKE_THIN}
                      />
                    </Button>
                  </div>
                </ListTableCell>
              </ListTableRow>
            ))}
          </ListTableBody>
        </ListTable>
      </ListTableWrap>

      {qrInstanceId ? (
        <QrCodeModal
          orgSlug={orgSlug}
          instanceId={qrInstanceId}
          open={Boolean(qrInstanceId)}
          onOpenChange={(open) => {
            if (!open) {
              setQrInstanceId(null);
              router.refresh();
            }
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
