import { Badge } from '@/components/ui/badge';
import { CHANNEL_STATUS_LABELS } from '@/lib/labels/channels';
import type { ChannelInstanceStatus } from '@prisma/client';

const VARIANTS: Record<
  ChannelInstanceStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'secondary',
  QR_REQUIRED: 'secondary',
  CONNECTING: 'secondary',
  CONNECTED: 'default',
  DISCONNECTED: 'outline',
  ERROR: 'destructive',
  INACTIVE: 'outline',
};

export function ChannelStatusBadge({
  status,
}: {
  status: ChannelInstanceStatus;
}) {
  return (
    <Badge variant={VARIANTS[status]}>{CHANNEL_STATUS_LABELS[status]}</Badge>
  );
}
