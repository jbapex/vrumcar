'use client';

import {
  Calendar,
  Car,
  Columns3,
  ImageIcon,
  MessageSquare,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
}

interface Props {
  orgSlug: string;
  leadId: string | null;
  vehicle: Vehicle | null | undefined;
  interestedCount: number;
  onInsertText: (text: string) => void;
  disabled?: boolean;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function vehicleLabel(v: Vehicle) {
  return `${v.brand} ${v.model}${v.year ? ` ${v.year}` : ''}`;
}

export function InboxContextShortcuts({
  orgSlug,
  leadId,
  vehicle,
  interestedCount,
  onInsertText,
  disabled,
}: Props) {
  const carName = vehicle ? vehicleLabel(vehicle) : null;

  const shortcuts = [
    vehicle
      ? {
          key: 'photos',
          label: 'Enviar fotos',
          icon: ImageIcon,
          onClick: () =>
            onInsertText(
              `Vou separar as fotos e vídeos do ${carName} e te mando em seguida, tudo bem?`,
            ),
        }
      : null,
    vehicle
      ? {
          key: 'price',
          label: 'Informar preço',
          icon: Tag,
          onClick: () =>
            onInsertText(
              `O ${carName} está por ${formatPrice(vehicle.salePriceCents)}. Posso te passar as condições de pagamento?`,
            ),
        }
      : null,
    vehicle
      ? {
          key: 'available',
          label: 'Confirmar disponível',
          icon: MessageSquare,
          onClick: () =>
            onInsertText(
              `Sim! O ${carName} ainda está disponível. Quer agendar uma visita ou test drive?`,
            ),
        }
      : null,
    leadId
      ? {
          key: 'test-drive',
          label: 'Agendar test drive',
          icon: Calendar,
          href: `/${orgSlug}/calendar?leadId=${leadId}&new=1${vehicle ? `&vehicleId=${vehicle.id}` : ''}`,
        }
      : null,
    vehicle
      ? {
          key: 'stock',
          label: 'Ver no estoque',
          icon: Car,
          href: `/${orgSlug}/vehicles/${vehicle.id}`,
        }
      : null,
    leadId
      ? {
          key: 'pipeline',
          label: 'Pipeline',
          icon: Columns3,
          href: `/${orgSlug}/pipeline`,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: typeof Car;
    href?: string;
    onClick?: () => void;
  }>;

  if (shortcuts.length === 0 && !vehicle) return null;

  return (
    <div className="shrink-0 border-t border-zinc-200/80 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
      {vehicle ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-800 dark:bg-purple-950/50 dark:text-purple-200">
            <Car className="size-3" />
            {carName}
          </span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {formatPrice(vehicle.salePriceCents)}
          </span>
          {interestedCount > 1 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              +{interestedCount - 1} interessado
              {interestedCount - 1 === 1 ? '' : 's'} neste carro
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mb-2 text-xs text-zinc-500">
          Defina o veículo de interesse no painel lateral → aba Lead
        </p>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          const className =
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-purple-800 dark:hover:bg-purple-950/40';

          if (s.href) {
            return (
              <Link
                key={s.key}
                href={s.href}
                className={className}
                target={s.key === 'stock' ? '_blank' : undefined}
              >
                <Icon className="size-3.5" />
                {s.label}
              </Link>
            );
          }

          return (
            <button
              key={s.key}
              type="button"
              disabled={disabled}
              onClick={s.onClick}
              className={className}
            >
              <Icon className="size-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
