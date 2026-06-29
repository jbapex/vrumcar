'use client';

import { updateLeadInterestAction } from '@/app/[orgSlug]/inbox/actions';
import { formatPriceBRL } from '@/lib/format';
import { Car, ExternalLink, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
}

interface InterestVehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
}

interface Props {
  orgSlug: string;
  leadId: string;
  conversationId: string;
  interestVehicle: InterestVehicle | null | undefined;
  interestDescription: string | null | undefined;
  interestedCount: number;
  vehicles: VehicleOption[];
}

export function LeadInterestCard({
  orgSlug,
  leadId,
  conversationId,
  interestVehicle,
  interestDescription,
  interestedCount,
  vehicles,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vehicleId, setVehicleId] = useState(interestVehicle?.id ?? '');
  const [description, setDescription] = useState(interestDescription ?? '');
  const [saved, setSaved] = useState(false);

  const selected =
    interestVehicle ??
    (vehicleId ? vehicles.find((v) => v.id === vehicleId) : null);

  const save = (nextVehicleId: string, nextDescription: string) => {
    startTransition(async () => {
      try {
        await updateLeadInterestAction(
          orgSlug,
          leadId,
          {
            interestVehicleId: nextVehicleId || null,
            interestDescription: nextDescription || null,
          },
          conversationId,
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao salvar');
      }
    });
  };

  return (
    <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 dark:border-purple-900/60 dark:from-purple-950/30 dark:to-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-purple-600 text-white">
            <Car className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-purple-800 uppercase dark:text-purple-300">
              Interesse no veículo
            </p>
            {selected ? (
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {selected.brand} {selected.model}
                {'year' in selected && selected.year
                  ? ` ${selected.year}`
                  : ''}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">Nenhum definido ainda</p>
            )}
          </div>
        </div>
        {isPending ? (
          <Loader2 className="size-4 animate-spin text-purple-600" />
        ) : saved ? (
          <span className="text-xs font-medium text-green-600">Salvo!</span>
        ) : null}
      </div>

      {selected ? (
        <div className="mt-3 space-y-2">
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {formatPriceBRL(selected.salePriceCents)}
          </p>
          {interestedCount > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <Users className="size-3.5" />
              <span>
                {interestedCount}{' '}
                {interestedCount === 1
                  ? 'pessoa interessada'
                  : 'pessoas interessadas'}{' '}
                neste carro
              </span>
            </div>
          ) : null}
          <Link
            href={`/${orgSlug}/vehicles/${selected.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline dark:text-purple-300"
          >
            Ver ficha no estoque
            <ExternalLink className="size-3" />
          </Link>
        </div>
      ) : null}

      <div className="mt-4 space-y-2 border-t border-purple-100 pt-3 dark:border-purple-900/40">
        <label
          htmlFor="interest-vehicle"
          className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Vincular veículo do estoque
        </label>
        <select
          id="interest-vehicle"
          value={vehicleId}
          disabled={isPending}
          onChange={(e) => {
            const id = e.target.value;
            setVehicleId(id);
            save(id, description);
          }}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Selecionar veículo…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model} {v.year ?? ''} —{' '}
              {formatPriceBRL(v.salePriceCents)}
            </option>
          ))}
        </select>

        <label
          htmlFor="interest-desc"
          className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Descrição livre (ex: &quot;Civic preto 2020&quot;)
        </label>
        <textarea
          id="interest-desc"
          rows={2}
          value={description}
          disabled={isPending}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== (interestDescription ?? '')) {
              save(vehicleId, description);
            }
          }}
          placeholder="O que o cliente mencionou ou busca?"
          className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
    </div>
  );
}
