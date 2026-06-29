'use client';

import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const EMOJI_GROUPS = [
  {
    id: 'faces',
    label: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '🙂', '😉',
      '😍', '🥰', '😘', '😗', '😋', '😎', '🤩', '🥳', '😇', '🤗',
      '🤔', '😐', '😑', '😶', '🙄', '😏', '😬', '😌', '😴', '🤤',
    ],
  },
  {
    id: 'gestures',
    label: '👍',
    emojis: [
      '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✌️', '🤞', '🤙',
      '👋', '🫶', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💯',
      '🔥', '⭐', '✨', '💫', '🎉', '🎊', '👀', '💬', '💭', '😢',
    ],
  },
  {
    id: 'auto',
    label: '🚗',
    emojis: [
      '🚗', '🚙', '🏎️', '🛻', '🚐', '🏍️', '🔑', '📍', '📅', '⏰',
      '📞', '📲', '💰', '💳', '🧾', '✅', '❌', '⚠️', '❓', '❗',
      '📸', '📎', '📝', '🏠', '🛣️', '⛽', '🔧', '🛞', '🚦', '🅿️',
    ],
  },
] as const;

interface Props {
  disabled?: boolean;
  text: string;
  onTextChange: (value: string) => void;
  inputId?: string;
}

export function InboxEmojiPicker({
  disabled,
  text,
  onTextChange,
  inputId = 'inbox-composer',
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const insertEmoji = (emoji: string) => {
    const el = document.getElementById(inputId) as HTMLTextAreaElement | null;
    if (!el) {
      onTextChange(text + emoji);
      return;
    }

    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    onTextChange(next);

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors',
          'hover:bg-zinc-100 hover:text-amber-600 disabled:opacity-40',
          'dark:hover:bg-zinc-800 dark:hover:text-amber-400',
          open && 'bg-zinc-100 text-amber-600 dark:bg-zinc-800',
        )}
        title="Emojis"
        aria-label="Inserir emoji"
        aria-expanded={open}
      >
        <Smile className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className="absolute bottom-full left-0 z-50 mb-2 w-[min(100vw-2rem,280px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          role="dialog"
          aria-label="Seletor de emojis"
        >
          <div className="flex gap-1 border-b border-zinc-100 p-1.5 dark:border-zinc-800">
            {EMOJI_GROUPS.map((group, index) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(index)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors',
                  activeGroup === index
                    ? 'bg-purple-100 dark:bg-purple-950/50'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                )}
                aria-label={`Categoria ${group.id}`}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto p-2">
            {EMOJI_GROUPS[activeGroup]?.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
