import { MessageCircle } from 'lucide-react';

interface Props {
  connectedChannels: number;
}

export function InboxSidebarHeader({ connectedChannels }: Props) {
  const channelLabel =
    connectedChannels === 0
      ? 'Nenhum canal conectado'
      : connectedChannels === 1
        ? '1 canal online'
        : `${connectedChannels} canais online`;

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-gradient-to-r from-emerald-50/80 to-white px-4 py-3.5 dark:border-zinc-800 dark:from-emerald-950/20 dark:to-zinc-950">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
        <MessageCircle className="h-5 w-5 text-white" strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Atendimento
        </h1>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          WhatsApp · {channelLabel}
        </p>
      </div>
    </div>
  );
}
