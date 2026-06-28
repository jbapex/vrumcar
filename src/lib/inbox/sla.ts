export type SlaLevel = 'ok' | 'warning' | 'critical';

const WARNING_MINUTES = 15;
const CRITICAL_MINUTES = 60;

export function getConversationSlaLevel(input: {
  unreadCount: number;
  lastMessageAt: Date | string | null;
  lastMessageDirection?: 'INBOUND' | 'OUTBOUND' | null;
  status: string;
}): SlaLevel | null {
  if (input.status === 'RESOLVED') return null;

  const waiting =
    input.unreadCount > 0 || input.lastMessageDirection === 'INBOUND';
  if (!waiting || !input.lastMessageAt) return null;

  const ageMinutes =
    (Date.now() - new Date(input.lastMessageAt).getTime()) / 60_000;

  if (ageMinutes >= CRITICAL_MINUTES) return 'critical';
  if (ageMinutes >= WARNING_MINUTES) return 'warning';
  return 'ok';
}

export function slaLabel(level: SlaLevel): string {
  if (level === 'critical') return 'Aguardando +1h';
  if (level === 'warning') return 'Aguardando +15min';
  return 'Aguardando';
}

export function slaTimeClass(level: SlaLevel): string {
  if (level === 'critical') {
    return 'font-semibold text-red-600 dark:text-red-400';
  }
  if (level === 'warning') {
    return 'font-semibold text-amber-600 dark:text-amber-400';
  }
  return '';
}
