// LEGACY: este botão foi substituído pelo RegisterSaleDialog.
// Mantido pra não quebrar imports, mas não é mais usado na UI.

'use client';

import { useTransition } from 'react';
import { convertToCustomerAction } from '@/app/[orgSlug]/leads/actions';
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

export function ConvertToCustomerButton({
  orgSlug,
  leadId,
  disabled,
}: {
  orgSlug: string;
  leadId: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || pending}
          />
        }
      >
        Converter em cliente
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Converter em cliente</DialogTitle>
          <DialogDescription>
            Confirma que esse lead fechou venda e deseja converter em cliente?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              start(() => {
                void convertToCustomerAction(orgSlug, leadId);
              });
            }}
          >
            {pending ? 'Convertendo...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
