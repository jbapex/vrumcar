import { Badge } from '@/components/ui/badge';
import type { VehicleStatus } from '@prisma/client';

const STATUS_CONFIG: Record<
  VehicleStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  AVAILABLE: { label: 'Disponível', variant: 'default' },
  RESERVED: { label: 'Reservado', variant: 'secondary' },
  SOLD: { label: 'Vendido', variant: 'outline' },
  IN_PREPARATION: { label: 'Em Preparação', variant: 'secondary' },
  IN_MAINTENANCE: { label: 'Em Manutenção', variant: 'secondary' },
  INACTIVE: { label: 'Inativo', variant: 'outline' },
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
