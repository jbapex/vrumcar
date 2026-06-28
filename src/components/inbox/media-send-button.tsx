'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Send,
  X,
} from 'lucide-react';

interface MediaSendContextValue {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  sending: boolean;
  openFilePicker: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MediaSendContext = createContext<MediaSendContextValue | null>(null);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (mimeType.startsWith('audio/')) return <Mic className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

interface ProviderProps {
  orgSlug: string;
  conversationId: string;
  children: ReactNode;
}

export function MediaSendProvider({
  orgSlug,
  conversationId,
  children,
}: ProviderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      setError('Arquivo muito grande (máximo 16MB)');
      return;
    }

    setSelectedFile(file);
    setError(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!selectedFile) return;

    setSending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (caption.trim() && selectedFile.type.startsWith('image/')) {
        formData.append('caption', caption.trim());
      }

      const resp = await fetch(
        `/api/${orgSlug}/conversations/${conversationId}/send-media`,
        { method: 'POST', body: formData },
      );

      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `HTTP ${resp.status}`);
      }

      handleCancel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <MediaSendContext.Provider
      value={{ fileInputRef, sending, openFilePicker, handleFileSelect }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        className="hidden"
        onChange={handleFileSelect}
      />

      {selectedFile ? (
        <div className="border-b border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-start gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="h-16 w-16 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700">
                {getFileIcon(selectedFile.type)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-zinc-500">
                {formatSize(selectedFile.size)}
              </p>

              {selectedFile.type.startsWith('image/') ? (
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Adicionar legenda..."
                  className="mt-2 w-full rounded-md border border-zinc-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-950"
                  disabled={sending}
                />
              ) : null}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="rounded-full bg-purple-600 p-2 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={sending}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-200 disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}
    </MediaSendContext.Provider>
  );
}

export function MediaAttachButton({ disabled }: { disabled?: boolean }) {
  const ctx = useContext(MediaSendContext);
  if (!ctx) {
    throw new Error('MediaAttachButton must be used within MediaSendProvider');
  }

  return (
    <button
      type="button"
      onClick={ctx.openFilePicker}
      disabled={ctx.sending || disabled}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/80 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      title="Enviar arquivo"
    >
      <Paperclip className="h-5 w-5" />
    </button>
  );
}
