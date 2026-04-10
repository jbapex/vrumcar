'use client';

import { Copy, Forward, MoreVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  messageText: string | null;
  canDelete: boolean;
  onDelete?: () => void;
}

export function MessageContextMenu({
  messageText,
  canDelete,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
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
        <div className="absolute top-full right-0 z-50 mt-1 min-w-[140px] rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
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
