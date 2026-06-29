'use client';

import { QUICK_REACTION_EMOJIS } from '@/lib/inbox/message-reactions';
import { Copy, Forward, MoreVertical, Reply, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  messageText: string | null;
  canDelete: boolean;
  canReply?: boolean;
  canReact?: boolean;
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  onDelete?: () => void;
}

export function MessageContextMenu({
  messageText,
  canDelete,
  canReply,
  canReact,
  onReply,
  onReact,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowReactions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleCopy = async () => {
    if (messageText) {
      try {
        await navigator.clipboard.writeText(messageText);
      } catch (err) {
        console.error('Falha ao copiar:', err);
      }
    }
    setOpen(false);
  };

  const handleForward = () => {
    alert('Encaminhar: em breve');
    setOpen(false);
  };

  const handleDeleteClick = () => {
    onDelete?.();
    setOpen(false);
  };

  const handleReply = () => {
    onReply?.();
    setOpen(false);
  };

  const handleReact = (emoji: string) => {
    onReact?.(emoji);
    setOpen(false);
    setShowReactions(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full p-1 opacity-100 transition-opacity hover:bg-black/10 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-white/10"
        aria-label="Opções da mensagem"
      >
        <MoreVertical className="h-3 w-3" />
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-1 min-w-[160px] rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {canReact ? (
            <>
              <button
                type="button"
                onClick={() => setShowReactions((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span className="text-base">😊</span>
                Reagir
              </button>
              {showReactions ? (
                <div className="flex flex-wrap gap-1 border-t border-zinc-100 px-2 py-2 dark:border-zinc-800">
                  {QUICK_REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReact(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleReact('')}
                    className="flex h-8 items-center rounded-md px-2 text-[11px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Remover reação"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
          {canReply ? (
            <button
              type="button"
              onClick={handleReply}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Reply className="h-3 w-3 shrink-0" />
              Responder
            </button>
          ) : null}
          {messageText ? (
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Copy className="h-3 w-3 shrink-0" />
              Copiar
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleForward}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Forward className="h-3 w-3 shrink-0" />
            Encaminhar
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-3 w-3 shrink-0" />
              Deletar
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
