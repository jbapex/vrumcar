'use client';

import { sendMessageAction } from '@/app/[orgSlug]/inbox/actions';
import { ContactAvatar } from '@/components/inbox/contact-avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatPhone } from '@/lib/format/phone';
import { formatRelativeTime } from '@/lib/format/relative-time';
import type { Message } from '@prisma/client';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

interface ChatViewProps {
  orgSlug: string;
  conversation: {
    id: string;
    contactName: string | null;
    contactAvatar: string | null;
    phoneNumber: string;
    leadId: string | null;
    lead: { id: string; name: string; status: string } | null;
  };
  messages: Message[];
}

function MessageStatusIcon({ status }: { status: Message['status'] }) {
  if (status === 'PENDING')
    return (
      <Clock className="h-3 w-3 text-zinc-400 dark:text-zinc-500" aria-hidden />
    );
  if (status === 'SENT')
    return (
      <Check className="h-3 w-3 text-zinc-400 dark:text-zinc-500" aria-hidden />
    );
  if (status === 'DELIVERED')
    return (
      <CheckCheck
        className="h-3 w-3 text-zinc-400 dark:text-zinc-500"
        aria-hidden
      />
    );
  if (status === 'READ')
    return <CheckCheck className="h-3 w-3 text-blue-300" aria-hidden />;
  if (status === 'FAILED')
    return <AlertCircle className="h-3 w-3 text-red-500" aria-hidden />;
  return null;
}

function nonTextLabel(type: Message['type']): string {
  switch (type) {
    case 'IMAGE':
      return '📷 Imagem';
    case 'AUDIO':
      return '🎵 Áudio';
    case 'VIDEO':
      return '🎥 Vídeo';
    case 'DOCUMENT':
      return '📄 Documento';
    case 'LOCATION':
      return '📍 Localização';
    case 'STICKER':
      return '🏷️ Figurinha';
    case 'CONTACT':
      return '👤 Contato';
    case 'SYSTEM':
      return 'ℹ️ Sistema';
    default:
      return 'Mensagem';
  }
}

export function ChatView({ orgSlug, conversation, messages }: ChatViewProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const messagesAsc = [...messages].reverse();

  const handleSend = () => {
    if (!text.trim()) return;
    setError(null);
    const formData = new FormData();
    formData.set('conversationId', conversation.id);
    formData.set('text', text);

    startTransition(async () => {
      try {
        await sendMessageAction(orgSlug, formData);
        setText('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao enviar');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName =
    conversation.contactName?.trim() ||
    formatPhone(conversation.phoneNumber) ||
    conversation.phoneNumber;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <ContactAvatar
              name={conversation.contactName}
              avatarUrl={conversation.contactAvatar}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{displayName}</p>
              <p className="text-muted-foreground text-xs">
                {formatPhone(conversation.phoneNumber)}
              </p>
            </div>
          </div>
          {conversation.lead ? (
            <Link
              href={`/${orgSlug}/leads/${conversation.lead.id}`}
              className="shrink-0 rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-950"
            >
              Ver lead → {conversation.lead.name}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-900/40">
        <div className="space-y-3">
          {messagesAsc.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhuma mensagem ainda.
            </p>
          ) : null}
          {messagesAsc.map((msg) => {
            const isOutbound = msg.direction === 'OUTBOUND';
            return (
              <div
                key={msg.id}
                className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    isOutbound
                      ? 'bg-green-600 text-white dark:bg-green-700'
                      : 'border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                  }`}
                >
                  {msg.type === 'TEXT' && msg.text ? (
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  ) : (
                    <p className="text-sm italic opacity-75">
                      {msg.type === 'TEXT'
                        ? 'Mensagem'
                        : nonTextLabel(msg.type)}
                    </p>
                  )}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOutbound ? 'text-white/70' : 'text-zinc-500'}`}
                  >
                    <span>{formatRelativeTime(msg.createdAt)}</span>
                    {isOutbound ? (
                      <MessageStatusIcon status={msg.status} />
                    ) : null}
                  </div>
                  {msg.errorMessage ? (
                    <p className="mt-1 text-xs text-red-100">{msg.errorMessage}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        {error ? (
          <p className="mb-2 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            rows={1}
            className="min-h-[40px] resize-none"
            disabled={isPending}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={isPending || !text.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
