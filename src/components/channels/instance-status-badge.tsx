export function InstanceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    CONNECTED: {
      label: 'Online',
      className:
        'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    },
    DISCONNECTED: {
      label: 'Offline',
      className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    },
    CONNECTING: {
      label: 'Conectando...',
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
    },
    QR_REQUIRED: {
      label: 'Aguardando QR',
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
    },
    PENDING: {
      label: 'Pendente',
      className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    },
    ERROR: {
      label: 'Erro',
      className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    },
    INACTIVE: {
      label: 'Inativo',
      className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    },
  };
  const config = map[status] ?? {
    label: status,
    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
