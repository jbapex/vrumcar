export function formatRelativeTime(date: Date | null): string {
  if (!date) return '';
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return 'ontem';
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('pt-BR');
}
