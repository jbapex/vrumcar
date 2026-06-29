'use client';

import type { LeadInteraction, LeadInteractionType } from '@prisma/client';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addInteractionAction } from '@/app/[orgSlug]/leads/actions';
import { INTERACTION_TYPE_LABELS } from '@/lib/labels/leads';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function relativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  return rtf.format(Math.round(diffMonth / 12), 'year');
}

const WHATSAPP_TYPES = new Set<LeadInteractionType>([
  'WHATSAPP_SENT',
  'WHATSAPP_RECEIVED',
]);

/** Tipos que o vendedor registra manualmente na ficha (não o espelho do chat). */
const ADD_TYPES: { value: LeadInteractionType; label: string }[] = [
  { value: 'NOTE', label: INTERACTION_TYPE_LABELS.NOTE },
  { value: 'PHONE_CALL', label: INTERACTION_TYPE_LABELS.PHONE_CALL },
  { value: 'EMAIL_SENT', label: INTERACTION_TYPE_LABELS.EMAIL_SENT },
  { value: 'EMAIL_RECEIVED', label: INTERACTION_TYPE_LABELS.EMAIL_RECEIVED },
  { value: 'VISIT', label: INTERACTION_TYPE_LABELS.VISIT },
  { value: 'PROPOSAL_SENT', label: INTERACTION_TYPE_LABELS.PROPOSAL_SENT },
  { value: 'TEST_DRIVE', label: INTERACTION_TYPE_LABELS.TEST_DRIVE },
];

function isTimelineActivity(ix: LeadInteraction): boolean {
  return !WHATSAPP_TYPES.has(ix.type);
}

export function LeadTimeline({
  orgSlug,
  leadId,
  interactions,
  authorNames,
  inboxConversationId,
}: {
  orgSlug: string;
  leadId: string;
  interactions: LeadInteraction[];
  authorNames: Record<string, string>;
  inboxConversationId?: string | null;
}) {
  const router = useRouter();

  const whatsappCount = interactions.filter((ix) =>
    WHATSAPP_TYPES.has(ix.type),
  ).length;

  const activities = [...interactions]
    .filter(isTimelineActivity)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Atividades</CardTitle>
        <p className="text-muted-foreground text-sm">
          Notas, ligações e visitas do CRM. O histórico completo do WhatsApp
          fica no Atendimento.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {inboxConversationId ? (
          <Link
            href={`/${orgSlug}/inbox/${inboxConversationId}?tab=attending`}
            className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-3 text-sm transition-colors hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-emerald-900 dark:text-emerald-100">
                Abrir conversa no WhatsApp
              </span>
              <span className="text-emerald-800/80 text-xs dark:text-emerald-300/90">
                {whatsappCount > 0
                  ? `${whatsappCount} mensagem${whatsappCount === 1 ? '' : 'ens'} registrada${whatsappCount === 1 ? '' : 's'} no atendimento`
                  : 'Ver chat com este lead'}
              </span>
            </span>
          </Link>
        ) : null}

        <form
          className="space-y-3"
          action={async (formData) => {
            await addInteractionAction(orgSlug, leadId, formData);
            router.refresh();
          }}
        >
          <div>
            <Label htmlFor="ix-type">Tipo</Label>
            <select
              id="ix-type"
              name="type"
              required
              defaultValue="NOTE"
              className="border-input bg-background mt-1 h-10 w-full rounded-md border px-3 text-sm"
            >
              {ADD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="ix-content">Conteúdo</Label>
            <Textarea
              id="ix-content"
              name="content"
              required
              minLength={1}
              rows={3}
              className="mt-1"
              placeholder="Ex: Cliente pediu retorno amanhã às 10h…"
            />
          </div>
          <Button type="submit">Adicionar nota</Button>
        </form>

        <ul className="space-y-4 border-t pt-4">
          {activities.length === 0 ? (
            <li className="text-muted-foreground text-sm">
              Nenhuma atividade registrada ainda. Use o formulário acima para
              anotar ligações, visitas e follow-ups.
            </li>
          ) : (
            activities.map((ix) => (
              <li key={ix.id} className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {INTERACTION_TYPE_LABELS[ix.type]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {relativeTime(ix.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{ix.content}</p>
                <p className="text-muted-foreground text-xs">
                  {ix.createdBy
                    ? (authorNames[ix.createdBy] ?? ix.createdBy)
                    : 'Sistema'}
                </p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
