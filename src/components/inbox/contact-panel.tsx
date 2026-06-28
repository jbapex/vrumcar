'use client';

import { formatCpf, formatPhone } from '@/lib/format/phone';
import { LEAD_STATUS_LABELS } from '@/lib/labels/leads';
import {
  Car,
  ExternalLink,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ContactAvatar } from './contact-avatar';
import { ContactNotesEditor } from './contact-notes-editor';

type Tab = 'contact' | 'details';

interface InterestVehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  status: string;
  notes: string | null;
  createdAt: Date | string;
  interestVehicle?: InterestVehicle | null;
}

interface ConversationInfo {
  id: string;
  channelName: string;
  createdAt: Date | string;
  lastMessageAt: Date | string | null;
  totalMessages: number;
}

interface Props {
  orgSlug: string;
  mode?: 'drawer' | 'sidebar';
  open: boolean;
  onClose: () => void;
  contactName: string | null;
  contactAvatar: string | null;
  phoneNumber: string;
  lead: Lead | null;
  conversationInfo: ConversationInfo;
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function formatDate(d: Date | string | null): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ContactPanelBody({
  orgSlug,
  tab,
  setTab,
  contactName,
  contactAvatar,
  phoneNumber,
  lead,
  conversationInfo,
}: {
  orgSlug: string;
  tab: Tab;
  setTab: (tab: Tab) => void;
  contactName: string | null;
  contactAvatar: string | null;
  phoneNumber: string;
  lead: Lead | null;
  conversationInfo: ConversationInfo;
}) {
  return (
    <>
      <div className="flex shrink-0 flex-col items-center border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
        <ContactAvatar
          name={contactName}
          avatarUrl={contactAvatar}
          size="lg"
        />
        <h2 className="mt-3 text-center text-lg font-semibold">
          {contactName ?? formatPhone(phoneNumber)}
        </h2>
        <p className="text-sm text-zinc-500">{formatPhone(phoneNumber)}</p>
      </div>

      <div className="flex shrink-0 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setTab('contact')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'contact'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Lead
        </button>
        <button
          type="button"
          onClick={() => setTab('details')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'details'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Conversa
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'contact' && (
          <div className="space-y-4">
            {lead ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {lead.name}
                    </span>
                  </div>
                  <div className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-800 dark:bg-purple-950/40 dark:text-purple-200">
                    Status:{' '}
                    {LEAD_STATUS_LABELS[
                      lead.status as keyof typeof LEAD_STATUS_LABELS
                    ] ?? lead.status}
                  </div>
                  {lead.phone ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {formatPhone(lead.phone)}
                      </span>
                    </div>
                  ) : null}
                  {lead.email ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-zinc-400" />
                      <span className="break-all text-zinc-600 dark:text-zinc-300">
                        {lead.email}
                      </span>
                    </div>
                  ) : null}
                  {lead.cpf ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {formatCpf(lead.cpf)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {lead.interestVehicle ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <p className="text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                      Veículo de interesse
                    </p>
                    <div className="mt-2 flex items-start gap-2">
                      <Car className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {lead.interestVehicle.brand}{' '}
                          {lead.interestVehicle.model}
                          {lead.interestVehicle.year
                            ? ` ${lead.interestVehicle.year}`
                            : ''}
                        </p>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatPrice(lead.interestVehicle.salePriceCents)}
                        </p>
                        <Link
                          href={`/${orgSlug}/vehicles/${lead.interestVehicle.id}`}
                          className="mt-1 inline-flex text-xs font-medium text-purple-700 hover:underline dark:text-purple-300"
                        >
                          Ver no estoque →
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}

                <Link
                  href={`/${orgSlug}/leads/${lead.id}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-950"
                >
                  Abrir ficha do lead
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <ContactNotesEditor
                    orgSlug={orgSlug}
                    leadId={lead.id}
                    initialNotes={lead.notes}
                  />
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">
                  Nenhum lead vinculado a esta conversa.
                </p>
                <Link
                  href={`/${orgSlug}/leads/new`}
                  className="mt-3 inline-flex text-sm font-medium text-purple-700 hover:underline dark:text-purple-300"
                >
                  Cadastrar lead →
                </Link>
              </div>
            )}
          </div>
        )}

        {tab === 'details' && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-zinc-500">Canal WhatsApp</p>
              <div className="mt-1 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-zinc-800 dark:text-zinc-200">
                  {conversationInfo.channelName}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500">
                Total de mensagens
              </p>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                {conversationInfo.totalMessages}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500">
                Última mensagem
              </p>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                {formatDate(conversationInfo.lastMessageAt)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500">
                Conversa iniciada em
              </p>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                {formatDate(conversationInfo.createdAt)}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function ContactPanel({
  orgSlug,
  mode = 'drawer',
  open,
  onClose,
  contactName,
  contactAvatar,
  phoneNumber,
  lead,
  conversationInfo,
}: Props) {
  const [tab, setTab] = useState<Tab>('contact');

  if (mode === 'sidebar') {
    return (
      <aside className="hidden h-full w-[min(100%,320px)] shrink-0 flex-col overflow-hidden border-l border-zinc-200/80 bg-white xl:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Contexto do lead
          </h3>
        </div>
        <ContactPanelBody
          orgSlug={orgSlug}
          tab={tab}
          setTab={setTab}
          contactName={contactName}
          contactAvatar={contactAvatar}
          phoneNumber={phoneNumber}
          lead={lead}
          conversationInfo={conversationInfo}
        />
      </aside>
    );
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 md:hidden"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        role="presentation"
        aria-hidden
      />

      <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="font-semibold">Contexto do lead</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ContactPanelBody
          orgSlug={orgSlug}
          tab={tab}
          setTab={setTab}
          contactName={contactName}
          contactAvatar={contactAvatar}
          phoneNumber={phoneNumber}
          lead={lead}
          conversationInfo={conversationInfo}
        />
      </div>
    </>
  );
}
