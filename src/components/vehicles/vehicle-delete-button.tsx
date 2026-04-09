'use client';

import { deleteVehicleAction } from '@/app/[orgSlug]/vehicles/actions';
import { Button } from '@/components/ui/button';
import { useTransition } from 'react';

export function VehicleDeleteButton({
  orgSlug,
  vehicleId,
}: {
  orgSlug: string;
  vehicleId: string;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm('Excluir este veículo? O registro ficará oculto (soft delete).')) {
          return;
        }
        start(() => {
          void deleteVehicleAction(orgSlug, vehicleId);
        });
      }}
    >
      Excluir
    </Button>
  );
}
