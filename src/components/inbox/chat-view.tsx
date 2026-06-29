'use client';

import {
  attendConversationAction,
  reactToMessageAction,
  reopenConversationAction,
  sendMessageAction,
} from '@/app/[orgSlug]/inbox/actions';
import { ChatHeader } from '@/components/inbox/chat-header';
import { ContactPanel } from '@/components/inbox/contact-panel';
import { InboxContextShortcuts } from '@/components/inbox/inbox-context-shortcuts';
import { InboxEmojiPicker } from '@/components/inbox/inbox-emoji-picker';
import { InboxQuickReplies } from '@/components/inbox/inbox-quick-replies';
import { InboxQuickTaskButton } from '@/components/inbox/inbox-quick-task-button';
import {
  MediaAttachButton,
  MediaSendProvider,
} from '@/components/inbox/media-send-button';
import { AudioMessage } from '@/components/inbox/media/audio-message';
import { DocumentMessage } from '@/components/inbox/media/document-message';
import { ImageMessage } from '@/components/inbox/media/image-message';
import { MessageContextMenu } from '@/components/inbox/message-context-menu';
import { MessageQuotePreview } from '@/components/inbox/message-quote-preview';
import { MessageReactionsDisplay } from '@/components/inbox/message-reactions-display';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/format/relative-time';
import {
  buildInboxConversationUrl,
  type InboxTab,
} from '@/lib/inbox/routing';
import type { Message, MessageType } from '@prisma/client';
import {
  AlertCircle,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Send,
  RotateCcw,
  UserPlus,
  WifiOff,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

type ChatMessage = Message & {
  replyTo?: {
    id: string;
    direction: string;
    type: MessageType;
    text: string | null;
    mediaCaption: string | null;
  } | null;
};

type OptimisticMessage = {
  clientId: string;
  text: string;
  status: 'PENDING' | 'FAILED';
  errorMessage?: string;
  createdAt: Date;
};

type DisplayMessage = ChatMessage | (OptimisticMessage & {
  id: string;
  direction: 'OUTBOUND';
  type: 'TEXT';
  isOptimistic: true;
});

function isOptimisticMessage(msg: DisplayMessage): msg is OptimisticMessage & {
  id: string;
  direction: 'OUTBOUND';
  type: 'TEXT';
  isOptimistic: true;
} {
  return 'isOptimistic' in msg && msg.isOptimistic === true;
}

function toDisplayMessage(opt: OptimisticMessage): DisplayMessage {
  return {
    ...opt,
    id: opt.clientId,
    direction: 'OUTBOUND',
    type: 'TEXT',
    isOptimistic: true,
    organizationId: '',
    conversationId: '',
    text: opt.text,
    status: opt.status,
    errorMessage: opt.errorMessage ?? null,
    createdAt: opt.createdAt,
    mediaUrl: null,
    mediaMimeType: null,
    mediaCaption: null,
    mediaSizeBytes: null,
    mediaFileName: null,
    externalMessageId: null,
    sentByUserId: null,
    sentAt: null,
    updatedAt: opt.createdAt,
  } as DisplayMessage;
}

interface ChatViewProps {
  orgSlug: string;
  conversation: {
    id: string;
    contactName: string | null;
    contactAvatar: string | null;
    phoneNumber: string;
    leadId: string | null;
    lead: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      cpf: string | null;
      birthDate: Date | string | null;
      status: string;
      source: string;
      priority: string;
      notes: string | null;
      createdAt: Date | string;
      assignedToId: string | null;
      estimatedValueCents: number | null;
      budgetMinCents: number | null;
      budgetMaxCents: number | null;
      hasTradeIn: boolean;
      tradeInDescription: string | null;
      interestDescription: string | null;
      interestVehicleId: string | null;
      assignedTo?: { id: string; name: string } | null;
      interestVehicle?: {
        id: string;
        brand: string;
        model: string;
        year: number | null;
        salePriceCents: number;
      } | null;
    } | null;
    channelInstance: {
      id: string;
      name: string;
      status: string;
    };
    createdAt: Date | string;
    lastMessageAt: Date | string | null;
    assignedToId: string | null;
    assignedTo: { id: string; name: string | null; email: string } | null;
    status: string;
  };
  messages: ChatMessage[];
  teamMembers: Array<{
    userId: string;
    name: string | null;
    email: string;
    role: string;
  }>;
  currentUserId: string;
  leadContext?: {
    pendingTasks: number;
    upcomingAppointments: number;
    vehicleInterestedCount: number;
  };
  stockVehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number | null;
    salePriceCents: number;
  }>;
}

function getMessageCopyText(msg: DisplayMessage): string | null {
  if (isOptimisticMessage(msg)) return msg.text;
  const text = msg.text?.trim();
  if (text) return msg.text ?? null;
  const cap = msg.mediaCaption?.trim();
  if (cap) return msg.mediaCaption ?? null;
  return null;
}

function formatDateSeparator(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) return 'Hoje';
  if (msgDate.getTime() === yesterday.getTime()) return 'Ontem';

  const diffDays = Math.floor(
    (today.getTime() - msgDate.getTime()) / 86400000,
  );
  if (diffDays < 7) {
    return d.toLocaleDateString('pt-BR', { weekday: 'long' });
  }

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function MessageStatusIcon({
  status,
}: {
  status: Message['status'] | OptimisticMessage['status'];
}) {
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
    return <CheckCheck className="h-3 w-3 text-blue-600" aria-hidden />;
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

export function ChatView({
  orgSlug,
  conversation,
  messages,
  teamMembers,
  currentUserId,
  leadContext,
  stockVehicles,
}: ChatViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onlyMine = searchParams.get('mine') === 'true';
  const search = searchParams.get('search') ?? undefined;
  const [text, setText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOptimisticMessages((prev) =>
      prev.filter((opt) => {
        if (opt.status === 'FAILED') return true;
        return !messages.some(
          (m) =>
            m.direction === 'OUTBOUND' &&
            m.text === opt.text &&
            Math.abs(
              new Date(m.createdAt).getTime() - opt.createdAt.getTime(),
            ) < 120_000,
        );
      }),
    );
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, optimisticMessages.length]);

  const messagesAsc: DisplayMessage[] = [
    ...[...messages].reverse(),
    ...optimisticMessages.map(toDisplayMessage),
  ];

  const channelOffline = conversation.channelInstance.status !== 'CONNECTED';
  const isResolved = conversation.status === 'RESOLVED';
  const needsAttend = !isResolved && !conversation.assignedToId;
  const assignedToOther =
    !isResolved &&
    Boolean(conversation.assignedToId) &&
    conversation.assignedToId !== currentUserId;
  const canReply =
    !channelOffline && !needsAttend && !assignedToOther && !isResolved;

  const navigateToTab = (tab: InboxTab) => {
    router.push(
      buildInboxConversationUrl(orgSlug, conversation.id, tab, {
        onlyMine,
        search,
      }),
    );
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !canReply) return;

    setError(null);
    const clientId = `opt-${crypto.randomUUID()}`;
    const sentText = trimmed;
    const replyId = replyToMessage?.id ?? null;
    setText('');
    setReplyToMessage(null);
    document.getElementById('inbox-composer')?.focus();

    setOptimisticMessages((prev) => [
      ...prev,
      {
        clientId,
        text: sentText,
        status: 'PENDING',
        createdAt: new Date(),
      },
    ]);

    void (async () => {
      try {
        const formData = new FormData();
        formData.set('conversationId', conversation.id);
        formData.set('text', sentText);
        if (replyId) formData.set('replyToMessageId', replyId);
        await sendMessageAction(orgSlug, formData);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao enviar';
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId
              ? { ...m, status: 'FAILED', errorMessage: message }
              : m,
          ),
        );
      }
    })();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttend = () => {
    startTransition(async () => {
      try {
        await attendConversationAction(orgSlug, conversation.id);
        navigateToTab('attending');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atender');
      }
    });
  };

  const handleReopen = () => {
    startTransition(async () => {
      try {
        await reopenConversationAction(orgSlug, conversation.id);
        navigateToTab('attending');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao reabrir');
      }
    });
  };

  const handleReact = (messageId: string, emoji: string) => {
    startTransition(async () => {
      try {
        await reactToMessageAction(
          orgSlug,
          conversation.id,
          messageId,
          emoji,
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao reagir');
      }
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 bg-white dark:bg-zinc-950">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatHeader
          orgSlug={orgSlug}
          conversation={conversation}
          teamMembers={teamMembers}
          onOpenContactPanel={() => setContactPanelOpen(true)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] p-4 dark:bg-zinc-900/60">
          <div className="space-y-3">
            {messagesAsc.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Nenhuma mensagem ainda.
              </p>
            ) : null}
            {messagesAsc.map((msg, idx) => {
              const prevMsg = idx > 0 ? messagesAsc[idx - 1] : null;
              const showDateSep =
                !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
              const isOutbound =
                isOptimisticMessage(msg) || msg.direction === 'OUTBOUND';
              const msgStatus = isOptimisticMessage(msg)
                ? msg.status
                : msg.status;
              const msgType = isOptimisticMessage(msg) ? 'TEXT' : msg.type;
              return (
                <div key={msg.id}>
                  {showDateSep ? (
                    <div className="my-4 flex items-center justify-center">
                      <span className="rounded-full bg-white/90 px-4 py-1 text-xs font-medium text-zinc-600 capitalize shadow-sm ring-1 ring-black/5 dark:bg-zinc-800/90 dark:text-zinc-300 dark:ring-white/10">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={`group relative flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                  >
                  <div className="relative inline-block max-w-[70%] pb-2">
                    <div
                      className={`rounded-lg px-3 py-2 shadow-sm ${
                        isOutbound
                          ? 'bg-[#d9fdd3] text-zinc-900'
                          : 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {!isOptimisticMessage(msg) && msg.replyTo ? (
                        <MessageQuotePreview
                          message={msg.replyTo}
                          isOutboundBubble={isOutbound}
                        />
                      ) : null}
                      {msgType === 'IMAGE' && !isOptimisticMessage(msg) ? (
                        <ImageMessage
                          orgSlug={orgSlug}
                          messageId={msg.id}
                          initialUrl={msg.mediaUrl}
                          initialMimeType={msg.mediaMimeType}
                          caption={msg.mediaCaption}
                        />
                      ) : null}
                      {msgType === 'AUDIO' && !isOptimisticMessage(msg) ? (
                        <AudioMessage
                          orgSlug={orgSlug}
                          messageId={msg.id}
                          initialUrl={msg.mediaUrl}
                          initialMimeType={msg.mediaMimeType}
                          sizeBytes={msg.mediaSizeBytes}
                          fileName={msg.mediaFileName}
                        />
                      ) : null}
                      {msgType === 'DOCUMENT' && !isOptimisticMessage(msg) ? (
                        <DocumentMessage
                          orgSlug={orgSlug}
                          messageId={msg.id}
                          initialUrl={msg.mediaUrl}
                          initialMimeType={msg.mediaMimeType}
                          sizeBytes={msg.mediaSizeBytes}
                          fileName={msg.mediaFileName}
                        />
                      ) : null}
                      {msgType === 'VIDEO' && !isOptimisticMessage(msg) ? (
                        <p className="text-sm italic opacity-75">
                          🎥 Vídeo (visualização em breve)
                        </p>
                      ) : null}
                      {!isOptimisticMessage(msg) &&
                      (msg.type === 'LOCATION' ||
                        msg.type === 'CONTACT' ||
                        msg.type === 'STICKER') && (
                        <p className="text-sm italic opacity-75">
                          {msg.type === 'LOCATION' && '📍 Localização'}
                          {msg.type === 'CONTACT' && '👤 Contato'}
                          {msg.type === 'STICKER' && '🏷️ Figurinha'}
                        </p>
                      )}
                      {msgType === 'TEXT' && msg.text ? (
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      ) : null}
                      {msgType === 'TEXT' && !msg.text ? (
                        <p className="text-sm italic opacity-75">Mensagem</p>
                      ) : null}
                      {!isOptimisticMessage(msg) &&
                      (msg.type === 'UNKNOWN' || msg.type === 'SYSTEM') && (
                        <p className="text-sm italic opacity-75">
                          {nonTextLabel(msg.type)}
                        </p>
                      )}
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isOutbound
                            ? 'text-emerald-800/60'
                            : 'text-zinc-500'
                        }`}
                      >
                        <span>{formatRelativeTime(msg.createdAt)}</span>
                        {isOutbound ? (
                          <MessageStatusIcon status={msgStatus} />
                        ) : null}
                      </div>
                      {msg.errorMessage ? (
                        <p className="mt-1 text-xs text-red-600">
                          {msg.errorMessage}
                        </p>
                      ) : null}
                    </div>
                    {!isOptimisticMessage(msg) ? (
                      <MessageReactionsDisplay
                        reactions={msg.reactions}
                        isOutbound={isOutbound}
                      />
                    ) : null}
                    {!isOptimisticMessage(msg) ? (
                    <div
                      className={`absolute top-0 z-10 ${isOutbound ? 'right-full mr-1' : 'left-full ml-1'}`}
                    >
                      <MessageContextMenu
                        messageText={getMessageCopyText(msg)}
                        canDelete={isOutbound}
                        canReply={canReply}
                        canReact={canReply && !isOutbound}
                        onReply={() => setReplyToMessage(msg)}
                        onReact={(emoji) => handleReact(msg.id, emoji)}
                        onDelete={() => alert('Deletar: em breve')}
                      />
                    </div>
                    ) : null}
                  </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mt-auto shrink-0 bg-[#f0f2f5] dark:bg-zinc-900">
          {channelOffline ? (
            <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-50/90 px-4 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
              <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="min-w-0 flex-1 truncate text-xs text-amber-900 dark:text-amber-200">
                Canal <span className="font-medium">{conversation.channelInstance.name}</span> offline — envio pausado
              </p>
              <Link
                href={`/${orgSlug}/channels`}
                className="shrink-0 text-xs font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
              >
                Reconectar
              </Link>
            </div>
          ) : null}

          {isResolved ? (
            <div className="flex items-center gap-3 border-b border-green-200/70 bg-green-50/90 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/30">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700 dark:text-green-300" />
              <p className="min-w-0 flex-1 text-xs text-green-900 dark:text-green-100">
                Atendimento encerrado.{' '}
                <span className="font-semibold">Reabra</span> para voltar a
                conversar com este lead.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleReopen}
                disabled={isPending}
                className="shrink-0 border-green-300 bg-white dark:border-green-800 dark:bg-green-950"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reabrir
              </Button>
            </div>
          ) : null}

          {needsAttend ? (
            <div className="flex items-center gap-3 border-b border-purple-200/70 bg-purple-50/90 px-4 py-3 dark:border-purple-900/40 dark:bg-purple-950/30">
              <UserPlus className="h-4 w-4 shrink-0 text-purple-700 dark:text-purple-300" />
              <p className="min-w-0 flex-1 text-xs text-purple-900 dark:text-purple-100">
                Esta conversa está na <span className="font-semibold">Entrada</span>.
                Clique em <span className="font-semibold">Atender</span> para
                assumir o lead e liberar o envio de mensagens.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleAttend}
                disabled={isPending}
                className="shrink-0"
              >
                Atender
              </Button>
            </div>
          ) : null}

          {assignedToOther ? (
            <div className="border-b border-amber-200/70 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              Atendida por{' '}
              <span className="font-semibold">
                {conversation.assignedTo?.name ??
                  conversation.assignedTo?.email ??
                  'outro vendedor'}
              </span>
              . Use <span className="font-semibold">Reatribuir</span> para
              transferir para você.
            </div>
          ) : null}

          <MediaSendProvider
            orgSlug={orgSlug}
            conversationId={conversation.id}
          >
            {error ? (
              <p className="border-b border-red-200/60 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            ) : null}

            {replyToMessage ? (
              <div className="flex items-start gap-2 border-b border-zinc-200/80 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                    Respondendo
                  </p>
                  <MessageQuotePreview
                    message={replyToMessage}
                    isOutboundBubble={false}
                    compact
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToMessage(null)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                  aria-label="Cancelar resposta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <InboxContextShortcuts
              orgSlug={orgSlug}
              leadId={conversation.leadId}
              vehicle={conversation.lead?.interestVehicle ?? null}
              interestedCount={leadContext?.vehicleInterestedCount ?? 0}
              onInsertText={(replyText) => setText(replyText)}
              disabled={!canReply}
            />

            <InboxQuickReplies
              disabled={!canReply}
              onSelect={(replyText) => setText(replyText)}
            />

            <div className="flex items-end gap-2 px-3 py-3">
              <InboxQuickTaskButton
                orgSlug={orgSlug}
                conversationId={conversation.id}
                leadId={conversation.leadId}
                leadName={conversation.lead?.name ?? conversation.contactName}
                vehicleId={conversation.lead?.interestVehicleId ?? null}
                teamMembers={teamMembers}
                currentUserId={currentUserId}
                pendingTasks={leadContext?.pendingTasks ?? 0}
              />
              <MediaAttachButton disabled={!canReply} />
              <div className="flex min-w-0 flex-1 items-end gap-1 rounded-3xl bg-white px-2 py-2 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-950 dark:ring-white/10">
                <InboxEmojiPicker
                  disabled={!canReply}
                  text={text}
                  onTextChange={setText}
                />
                <Textarea
                  id="inbox-composer"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    channelOffline
                      ? 'Reconecte o canal para enviar...'
                      : isResolved
                        ? 'Reabra o atendimento para responder...'
                        : needsAttend
                          ? 'Atenda a conversa para responder...'
                          : assignedToOther
                            ? 'Conversa com outro vendedor...'
                            : 'Digite uma mensagem...'
                  }
                  rows={1}
                  disabled={!canReply}
                  className="max-h-32 min-h-[24px] flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 disabled:opacity-60"
                />
              </div>
              <Button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() || !canReply}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full shadow-sm disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </MediaSendProvider>
        </div>
      </div>

      <ContactPanel
        orgSlug={orgSlug}
        mode="sidebar"
        open
        onClose={() => {}}
        contactName={conversation.contactName}
        contactAvatar={conversation.contactAvatar}
        phoneNumber={conversation.phoneNumber}
        lead={conversation.lead}
        leadContext={leadContext}
        vehicles={stockVehicles}
        teamMembers={teamMembers}
        conversationInfo={{
          id: conversation.id,
          channelName: conversation.channelInstance.name,
          createdAt: conversation.createdAt,
          lastMessageAt: conversation.lastMessageAt,
          totalMessages: messages.length,
        }}
      />

      <ContactPanel
        orgSlug={orgSlug}
        mode="drawer"
        open={contactPanelOpen}
        onClose={() => setContactPanelOpen(false)}
        contactName={conversation.contactName}
        contactAvatar={conversation.contactAvatar}
        phoneNumber={conversation.phoneNumber}
        lead={conversation.lead}
        leadContext={leadContext}
        vehicles={stockVehicles}
        teamMembers={teamMembers}
        conversationInfo={{
          id: conversation.id,
          channelName: conversation.channelInstance.name,
          createdAt: conversation.createdAt,
          lastMessageAt: conversation.lastMessageAt,
          totalMessages: messages.length,
        }}
      />
    </div>
  );
}
