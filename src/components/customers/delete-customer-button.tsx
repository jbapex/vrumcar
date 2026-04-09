'use client';

import { useTransition } from 'react';
import { deleteCustomerAction } from '@/app/[orgSlug]/customers/actions';
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

export function DeleteCustomerButton({
  orgSlug,
  customerId,
}: {
  orgSlug: string;
  customerId: string;
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
          <DialogTitle>Excluir cliente</DialogTitle>
          <DialogDescription>
            Esta ação arquiva o cliente (exclusão lógica). Deseja continuar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              start(() => {
                void deleteCustomerAction(orgSlug, customerId);
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
