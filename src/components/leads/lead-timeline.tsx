'use client';

import type { LeadInteraction, LeadInteractionType } from '@prisma/client';
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

const ADD_TYPES: { value: LeadInteractionType; label: string }[] = [
  { value: 'NOTE', label: INTERACTION_TYPE_LABELS.NOTE },
  { value: 'PHONE_CALL', label: INTERACTION_TYPE_LABELS.PHONE_CALL },
  { value: 'WHATSAPP_SENT', label: INTERACTION_TYPE_LABELS.WHATSAPP_SENT },
  { value: 'WHATSAPP_RECEIVED', label: INTERACTION_TYPE_LABELS.WHATSAPP_RECEIVED },
  { value: 'EMAIL_SENT', label: INTERACTION_TYPE_LABELS.EMAIL_SENT },
  { value: 'EMAIL_RECEIVED', label: INTERACTION_TYPE_LABELS.EMAIL_RECEIVED },
  { value: 'VISIT', label: INTERACTION_TYPE_LABELS.VISIT },
  { value: 'PROPOSAL_SENT', label: INTERACTION_TYPE_LABELS.PROPOSAL_SENT },
  { value: 'TEST_DRIVE', label: INTERACTION_TYPE_LABELS.TEST_DRIVE },
];

export function LeadTimeline({
  orgSlug,
  leadId,
  interactions,
  authorNames,
}: {
  orgSlug: string;
  leadId: string;
  interactions: LeadInteraction[];
  authorNames: Record<string, string>;
}) {
  const router = useRouter();
  const sorted = [...interactions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
              placeholder="Descreva o contato ou a nota…"
            />
          </div>
          <Button type="submit">Adicionar</Button>
        </form>

        <ul className="space-y-4 border-t pt-4">
          {sorted.length === 0 ? (
            <li className="text-muted-foreground text-sm">
              Nenhuma interação ainda.
            </li>
          ) : (
            sorted.map((ix) => (
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
                    : '—'}
                </p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
