import { MessageSquareText } from 'lucide-react';

export function InboxEmptyPanel() {
  return (
    <div className="hidden h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#f0f2f5] p-8 md:flex dark:bg-zinc-900/40">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
          <MessageSquareText
            className="h-9 w-9 text-emerald-600"
            strokeWidth={1.75}
          />
        </div>
        <h2 className="mt-6 text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          Atendimento da loja
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Selecione uma conversa para responder leads, enviar informações de
          veículos e fechar negócios — tudo pelo WhatsApp, sem sair do CRM.
        </p>
      </div>
    </div>
  );
}
