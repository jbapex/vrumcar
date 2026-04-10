'use client';

import { updateLeadNotesAction } from '@/app/[orgSlug]/inbox/actions';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  orgSlug: string;
  leadId: string;
  initialNotes: string | null;
}

/**
 * Textarea com auto-save após 1.2s de idle.
 * Mostra indicador visual de "salvando..." / "salvo" discreto.
 */
export function ContactNotesEditor({
  orgSlug,
  leadId,
  initialNotes,
}: Props) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(initialNotes ?? '');

  useEffect(() => {
    if (notes === lastSavedRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setStatus('idle');

    saveTimeoutRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await updateLeadNotesAction(orgSlug, leadId, notes);
        lastSavedRef.current = notes;
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (err) {
        console.error('Erro ao salvar notes:', err);
        setStatus('error');
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notes, orgSlug, leadId]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Observações do contato
        </label>
        {status === 'saving' && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Salvando...
          </span>
        )}
        {status === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            Salvo
          </span>
        )}
        {status === 'error' && (
          <span className="text-xs text-red-600 dark:text-red-400">
            Erro ao salvar
          </span>
        )}
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Ex: interessado no Civic 2020, pediu desconto, quer financiar..."
        className="resize-none text-sm"
      />
    </div>
  );
}
