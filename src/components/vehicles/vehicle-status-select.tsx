'use client';

import type { VehicleStatus } from '@prisma/client';
import { useTransition } from 'react';
import { updateStatusAction } from '@/app/[orgSlug]/vehicles/actions';

const OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'RESERVED', label: 'Reservado' },
  { value: 'SOLD', label: 'Vendido' },
  { value: 'IN_PREPARATION', label: 'Em preparação' },
  { value: 'IN_MAINTENANCE', label: 'Em manutenção' },
  { value: 'INACTIVE', label: 'Inativo' },
];

export function VehicleStatusSelect({
  orgSlug,
  vehicleId,
  current,
}: {
  orgSlug: string;
  vehicleId: string;
  current: VehicleStatus;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Mudar status:</span>
      <select
        disabled={pending}
        defaultValue={current}
        onChange={(e) => {
          const v = e.target.value as VehicleStatus;
          start(() => {
            void updateStatusAction(orgSlug, vehicleId, v);
          });
        }}
        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
