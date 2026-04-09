import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@prisma/client';

const STATUS_CONFIG: Record<
  LeadStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  NEW: { label: 'Novo', variant: 'default' },
  CONTACTED: { label: 'Contatado', variant: 'secondary' },
  QUALIFIED: { label: 'Qualificado', variant: 'default' },
  VISITING: { label: 'Visita agendada', variant: 'secondary' },
  NEGOTIATING: { label: 'Negociando', variant: 'secondary' },
  WON: { label: 'Ganhou', variant: 'default' },
  LOST: { label: 'Perdeu', variant: 'destructive' },
  ARCHIVED: { label: 'Arquivado', variant: 'outline' },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
