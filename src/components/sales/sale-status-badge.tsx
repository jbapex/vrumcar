import { Badge } from '@/components/ui/badge';
import { SALE_STATUS_LABELS } from '@/lib/labels/sales';
import type { SaleStatus } from '@prisma/client';

const VARIANTS: Record<
  SaleStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'secondary',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return (
    <Badge variant={VARIANTS[status]}>{SALE_STATUS_LABELS[status]}</Badge>
  );
}
