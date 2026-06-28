import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Inbox, WifiOff } from 'lucide-react';
import Link from 'next/link';

interface Props {
  orgSlug: string;
  message: string;
  noChannels?: boolean;
}

export function InboxListEmpty({ orgSlug, message, noChannels }: Props) {
  if (noChannels) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <div className="rounded-full bg-amber-50 p-4 dark:bg-amber-950/30">
          <WifiOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Nenhuma conversa ainda
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Conecte um canal WhatsApp para receber mensagens.
        </p>
        <Link
          href={`/${orgSlug}/channels`}
          className={cn(buttonVariants({ size: 'sm' }), 'mt-4')}
        >
          Ir para Canais
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
        <Inbox className="h-6 w-6 text-zinc-400" />
      </div>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}
