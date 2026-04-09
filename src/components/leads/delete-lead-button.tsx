'use client';

import { useTransition } from 'react';
import { deleteLeadAction } from '@/app/[orgSlug]/leads/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DeleteLeadButton({
  orgSlug,
  leadId,
}: {
  orgSlug: string;
  leadId: string;
}) {
  const [pending, start] = useTransition();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" disabled={pending} />
        }
      >
        Excluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir lead</DialogTitle>
          <DialogDescription>
            Esta ação arquiva o lead (exclusão lógica). Deseja continuar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              start(() => {
                void deleteLeadAction(orgSlug, leadId);
              });
            }}
          >
            {pending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
