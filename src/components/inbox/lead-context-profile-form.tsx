'use client';

import { updateLeadProfileAction } from '@/app/[orgSlug]/inbox/actions';
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from '@/lib/labels/leads';
import type { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { Check, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

export interface LeadProfileData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  birthDate: Date | string | null;
  status: string;
  source: string;
  priority: string;
  assignedToId: string | null;
  estimatedValueCents: number | null;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  hasTradeIn: boolean;
  tradeInDescription: string | null;
  interestVehicleId: string | null;
  interestDescription: string | null;
}

interface TeamMember {
  userId: string;
  name: string | null;
  email: string;
}

interface Props {
  orgSlug: string;
  conversationId: string;
  lead: LeadProfileData;
  teamMembers: TeamMember[];
}

function centsToReais(cents: number | null): string {
  if (cents == null) return '';
  return String(cents / 100);
}

function reaisToCents(value: string): number | null {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (Number.isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function formatBirthDateInput(value: Date | string | null): string {
  if (value == null) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function computeCompleteness(lead: LeadProfileData): number {
  const checks = [
    !!lead.name?.trim(),
    !!lead.phone,
    !!lead.email?.trim(),
    !!lead.cpf?.trim(),
    !!lead.birthDate,
    !!lead.assignedToId,
    !!(lead.interestVehicleId || lead.interestDescription?.trim()),
    !!(lead.budgetMinCents || lead.budgetMaxCents || lead.estimatedValueCents),
    !lead.hasTradeIn || !!lead.tradeInDescription?.trim(),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingHints(lead: LeadProfileData): string[] {
  const hints: string[] = [];
  if (!lead.email?.trim()) hints.push('e-mail');
  if (!lead.cpf?.trim()) hints.push('CPF');
  if (!lead.birthDate) hints.push('data de nascimento');
  if (!lead.assignedToId) hints.push('vendedor');
  if (!lead.interestVehicleId && !lead.interestDescription?.trim()) {
    hints.push('veículo de interesse');
  }
  if (!lead.budgetMinCents && !lead.budgetMaxCents && !lead.estimatedValueCents) {
    hints.push('orçamento');
  }
  return hints;
}

export function LeadContextProfileForm({
  orgSlug,
  conversationId,
  lead,
  teamMembers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [openNegociacao, setOpenNegociacao] = useState(true);
  const [openTroca, setOpenTroca] = useState(false);

  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email ?? '');
  const [cpf, setCpf] = useState(lead.cpf ?? '');
  const [birthDate, setBirthDate] = useState(formatBirthDateInput(lead.birthDate));
  const [status, setStatus] = useState(lead.status);
  const [source, setSource] = useState(lead.source);
  const [priority, setPriority] = useState(lead.priority);
  const [assignedToId, setAssignedToId] = useState(lead.assignedToId ?? '');
  const [budgetMin, setBudgetMin] = useState(centsToReais(lead.budgetMinCents));
  const [budgetMax, setBudgetMax] = useState(centsToReais(lead.budgetMaxCents));
  const [estimatedValue, setEstimatedValue] = useState(
    centsToReais(lead.estimatedValueCents),
  );
  const [hasTradeIn, setHasTradeIn] = useState(lead.hasTradeIn);
  const [tradeInDescription, setTradeInDescription] = useState(
    lead.tradeInDescription ?? '',
  );

  const draftLead: LeadProfileData = {
    ...lead,
    name,
    email: email || null,
    cpf: cpf || null,
    birthDate: birthDate ? new Date(birthDate) : null,
    status,
    source,
    priority,
    assignedToId: assignedToId || null,
    budgetMinCents: reaisToCents(budgetMin),
    budgetMaxCents: reaisToCents(budgetMax),
    estimatedValueCents: reaisToCents(estimatedValue),
    hasTradeIn,
    tradeInDescription: tradeInDescription || null,
  };

  const completeness = useMemo(() => computeCompleteness(draftLead), [draftLead]);
  const missing = useMemo(() => missingHints(draftLead), [draftLead]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateLeadProfileAction(orgSlug, lead.id, conversationId, {
          name: name.trim(),
          email: email.trim() || null,
          cpf: cpf.trim() || null,
          birthDate: birthDate || null,
          status,
          source,
          priority,
          assignedToId: assignedToId || null,
          budgetMinCents: reaisToCents(budgetMin),
          budgetMaxCents: reaisToCents(budgetMax),
          estimatedValueCents: reaisToCents(estimatedValue),
          hasTradeIn,
          tradeInDescription: tradeInDescription.trim() || null,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar');
      }
    });
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900';
  const labelClass = 'block text-xs font-medium text-zinc-600 dark:text-zinc-400';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Ficha do lead
            </p>
            <p className="text-[11px] text-zinc-500">
              {completeness === 100
                ? 'Cadastro completo'
                : `${completeness}% preenchida`}
            </p>
          </div>
          <span
            className={`text-sm font-bold ${
              completeness >= 80
                ? 'text-green-600'
                : completeness >= 50
                  ? 'text-amber-600'
                  : 'text-zinc-500'
            }`}
          >
            {completeness}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${
              completeness >= 80
                ? 'bg-green-500'
                : completeness >= 50
                  ? 'bg-amber-500'
                  : 'bg-purple-500'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        {missing.length > 0 && completeness < 100 ? (
          <p className="mt-2 text-[11px] text-zinc-500">
            Falta: {missing.join(', ')}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="ctx-name" className={labelClass}>
            Nome *
          </label>
          <input
            id="ctx-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="ctx-phone" className={labelClass}>
            Telefone (WhatsApp)
          </label>
          <input
            id="ctx-phone"
            value={lead.phone ?? ''}
            readOnly
            className={`${inputClass} cursor-not-allowed bg-zinc-100 text-zinc-500 dark:bg-zinc-800`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ctx-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="ctx-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ctx-cpf" className={labelClass}>
              CPF
            </label>
            <input
              id="ctx-cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ctx-birth-date" className={labelClass}>
              Data de nascimento
            </label>
            <input
              id="ctx-birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpenNegociacao(!openNegociacao)}
        className="flex w-full items-center gap-2 text-left text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400"
      >
        {openNegociacao ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        Negociação
      </button>

      {openNegociacao ? (
        <div className="space-y-3 pl-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="ctx-status" className={labelClass}>
                Status
              </label>
              <select
                id="ctx-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label htmlFor="ctx-priority" className={labelClass}>
                Prioridade
              </label>
              <select
                id="ctx-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputClass}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="HOT">Quente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="ctx-source" className={labelClass}>
                Origem
              </label>
              <select
                id="ctx-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputClass}
              >
                {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {LEAD_SOURCE_LABELS[s]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label htmlFor="ctx-assignee" className={labelClass}>
                Vendedor
              </label>
              <select
                id="ctx-assignee"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sem vendedor</option>
                {teamMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="ctx-budget-min" className={labelClass}>
                Orçamento mín (R$)
              </label>
              <input
                id="ctx-budget-min"
                inputMode="decimal"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="50000"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ctx-budget-max" className={labelClass}>
                Orçamento máx (R$)
              </label>
              <input
                id="ctx-budget-max"
                inputMode="decimal"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="80000"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ctx-estimated" className={labelClass}>
              Valor em negociação (R$)
            </label>
            <input
              id="ctx-estimated"
              inputMode="decimal"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="Preço combinado ou proposta"
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpenTroca(!openTroca)}
        className="flex w-full items-center gap-2 text-left text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400"
      >
        {openTroca ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        Troca
      </button>

      {openTroca ? (
        <div className="space-y-2 pl-1">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={hasTradeIn}
              onChange={(e) => setHasTradeIn(e.target.checked)}
              className="rounded border-zinc-300"
            />
            Cliente tem carro na troca
          </label>
          {hasTradeIn ? (
            <textarea
              value={tradeInDescription}
              onChange={(e) => setTradeInDescription(e.target.value)}
              rows={2}
              placeholder="Ex: Gol 2018, 80mil km, quer R$ 35mil na troca"
              className={`${inputClass} resize-none`}
            />
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saved ? (
          <Check className="size-4" />
        ) : null}
        {isPending ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar ficha'}
      </button>

      <Link
        href={`/${orgSlug}/leads/${lead.id}`}
        className="block text-center text-xs text-purple-600 hover:underline dark:text-purple-400"
      >
        Abrir ficha completa com histórico →
      </Link>
    </div>
  );
}
