'use client';

import { LeadContextActions } from '@/components/inbox/lead-context-actions';
import {
  LeadContextProfileForm,
  type LeadProfileData,
} from '@/components/inbox/lead-context-profile-form';
import { LeadInterestCard } from '@/components/inbox/lead-interest-card';
import { formatPhone } from '@/lib/format/phone';
import {
  GripVertical,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ContactAvatar } from './contact-avatar';
import { ContactNotesEditor } from './contact-notes-editor';

type Tab = 'contact' | 'actions' | 'details';

const MIN_WIDTH = 280;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 360;
const WIDTH_STORAGE_KEY = 'vrumcar-inbox-panel-width';
const COLLAPSED_STORAGE_KEY = 'vrumcar-inbox-panel-collapsed';

interface InterestVehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
}

interface Lead extends LeadProfileData {
  notes: string | null;
  createdAt: Date | string;
  assignedTo?: { id: string; name: string } | null;
  interestVehicle?: InterestVehicle | null;
}

interface TeamMember {
  userId: string;
  name: string | null;
  email: string;
}

interface LeadContext {
  pendingTasks: number;
  upcomingAppointments: number;
  vehicleInterestedCount: number;
}

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
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
  leadContext?: LeadContext;
  vehicles: VehicleOption[];
  teamMembers: TeamMember[];
  conversationInfo: ConversationInfo;
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
  leadContext,
  vehicles,
  teamMembers,
  conversationInfo,
}: {
  orgSlug: string;
  tab: Tab;
  setTab: (tab: Tab) => void;
  contactName: string | null;
  contactAvatar: string | null;
  phoneNumber: string;
  lead: Lead | null;
  leadContext?: LeadContext;
  vehicles: VehicleOption[];
  teamMembers: TeamMember[];
  conversationInfo: ConversationInfo;
}) {
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'contact', label: 'Lead' },
    { id: 'actions', label: 'Ações' },
    { id: 'details', label: 'Conversa' },
  ];

  return (
    <>
      <div className="flex shrink-0 flex-col items-center border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
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
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 px-2 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'contact' && (
          <div className="space-y-4">
            {lead ? (
              <>
                <LeadInterestCard
                  orgSlug={orgSlug}
                  leadId={lead.id}
                  conversationId={conversationInfo.id}
                  interestVehicle={lead.interestVehicle}
                  interestDescription={lead.interestDescription}
                  interestedCount={leadContext?.vehicleInterestedCount ?? 0}
                  vehicles={vehicles}
                />

                <LeadContextProfileForm
                  orgSlug={orgSlug}
                  conversationId={conversationInfo.id}
                  lead={lead}
                  teamMembers={teamMembers}
                />

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

        {tab === 'actions' && (
          <div>
            {lead ? (
              <LeadContextActions
                orgSlug={orgSlug}
                leadId={lead.id}
                vehicleId={lead.interestVehicle?.id}
                pendingTasks={leadContext?.pendingTasks ?? 0}
                upcomingAppointments={leadContext?.upcomingAppointments ?? 0}
              />
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">
                Vincule um lead para acessar ações do CRM.
              </p>
            )}
          </div>
        )}

        {tab === 'details' && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Canal WhatsApp
              </p>
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

function useResizablePanel(enabled: boolean) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const widthRef = useRef(width);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!enabled) return;
    const storedWidth = localStorage.getItem(WIDTH_STORAGE_KEY);
    const storedCollapsed = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (storedWidth) {
      const parsed = Number(storedWidth);
      if (!Number.isNaN(parsed)) {
        setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed)));
      }
    }
    if (storedCollapsed === 'true') setCollapsed(true);
  }, [enabled]);

  const persistWidth = useCallback((w: number) => {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(w));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const startResize = useCallback(
    (clientX: number) => {
      const startX = clientX;
      const startWidth = widthRef.current;

      const onMove = (ev: PointerEvent) => {
        const delta = startX - ev.clientX;
        const next = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, startWidth + delta),
        );
        setWidth(next);
      };

      const onUp = () => {
        persistWidth(widthRef.current);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [persistWidth],
  );

  return { width, collapsed, toggleCollapsed, startResize, setCollapsed };
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
  leadContext,
  vehicles,
  teamMembers,
  conversationInfo,
}: Props) {
  const [tab, setTab] = useState<Tab>('contact');
  const { width, collapsed, toggleCollapsed, startResize, setCollapsed } =
    useResizablePanel(mode === 'sidebar');

  if (mode === 'sidebar') {
    if (collapsed) {
      return (
        <aside className="hidden h-full w-10 shrink-0 flex-col items-center border-l border-zinc-200/80 bg-white py-3 xl:flex dark:border-zinc-800 dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => {
              setCollapsed(false);
              localStorage.setItem(COLLAPSED_STORAGE_KEY, 'false');
            }}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-purple-600 dark:hover:bg-zinc-800"
            title="Expandir contexto do lead"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </aside>
      );
    }

    return (
      <aside
        style={{ width }}
        className="relative hidden h-full shrink-0 flex-col overflow-hidden border-l border-zinc-200/80 bg-white xl:flex dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar painel"
          className="absolute top-0 left-0 z-10 flex h-full w-1.5 cursor-col-resize items-center justify-center hover:bg-purple-200/60 dark:hover:bg-purple-900/40"
          onPointerDown={(e) => {
            e.preventDefault();
            startResize(e.clientX);
          }}
        >
          <GripVertical className="pointer-events-none h-4 w-4 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Contexto do lead
          </h3>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            title="Recolher painel"
          >
            <PanelRightClose className="h-4 w-4" />
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
          leadContext={leadContext}
          vehicles={vehicles}
          teamMembers={teamMembers}
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

      <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
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
          leadContext={leadContext}
          vehicles={vehicles}
          teamMembers={teamMembers}
          conversationInfo={conversationInfo}
        />
      </div>
    </>
  );
}
