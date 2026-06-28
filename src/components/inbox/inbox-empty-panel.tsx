import { MessageSquareText } from 'lucide-react';

export function InboxEmptyPanel() {
  return (
    <div className="hidden h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-purple-50/40 p-8 md:flex dark:from-zinc-950 dark:via-zinc-950 dark:to-purple-950/20">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
        <MessageSquareText
          className="h-10 w-10 text-purple-500"
          strokeWidth={1.75}
        />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        Selecione uma conversa
      </h2>
      <p className="mt-1.5 max-w-xs text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Escolha um contato na lista ao lado para visualizar e responder
        mensagens.
      </p>
    </div>
  );
}
