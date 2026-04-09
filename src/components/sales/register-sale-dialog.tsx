'use client';

import { registerSaleAction } from '@/app/[orgSlug]/sales/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PAYMENT_METHOD_LABELS } from '@/lib/labels/sales';
import { DollarSign } from 'lucide-react';
import { useState, useTransition } from 'react';

/** Redirect de Server Action não deve ser tratado como falha no cliente. */
function isNextJsRedirectError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const d = (e as { digest?: unknown }).digest;
  return typeof d === 'string' && d.startsWith('NEXT_REDIRECT');
}

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
  status: string;
};

type User = {
  id: string;
  name: string | null;
  email: string;
};

interface Props {
  orgSlug: string;
  leadId: string;
  currentUserId: string;
  defaultVehicle: Vehicle | null;
  availableVehicles: Vehicle[];
  salesPeople: User[];
  leadName: string;
}

export function RegisterSaleDialog({
  orgSlug,
  leadId,
  currentUserId,
  defaultVehicle,
  availableVehicles,
  salesPeople,
  leadName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    defaultVehicle?.id ?? '',
  );

  const vehiclesInDropdown = (() => {
    const list = [...availableVehicles];
    if (defaultVehicle && !list.find((v) => v.id === defaultVehicle.id)) {
      list.unshift(defaultVehicle);
    }
    return list;
  })();

  const selectedVehicle = vehiclesInDropdown.find(
    (v) => v.id === selectedVehicleId,
  );

  const defaultPriceReais = selectedVehicle
    ? (selectedVehicle.salePriceCents / 100).toFixed(2)
    : '';

  const handleSubmit = (formData: FormData) => {
    setError(null);
    formData.set('leadId', leadId);
    startTransition(async () => {
      try {
        await registerSaleAction(orgSlug, formData);
      } catch (err) {
        if (isNextJsRedirectError(err)) {
          throw err;
        }
        setError(
          err instanceof Error ? err.message : 'Erro ao registrar venda',
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button">
            <DollarSign className="mr-2 h-4 w-4" />
            Registrar venda
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar venda — {leadName}</DialogTitle>
          <DialogDescription>
            Ao confirmar, o veículo será marcado como vendido, o lead como
            &quot;Ganhou&quot; e a venda entrará no histórico.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicleId">Veículo vendido *</Label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
            >
              <option value="">Selecione um veículo</option>
              {vehiclesInDropdown.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} {v.year ?? ''} — R${' '}
                  {(v.salePriceCents / 100).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="finalPriceReais">Preço final negociado (R$) *</Label>
            <Input
              id="finalPriceReais"
              name="finalPriceReais"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={defaultPriceReais}
              key={selectedVehicleId}
            />
            {selectedVehicle ? (
              <p className="mt-1 text-xs text-zinc-500">
                Preço de tabela: R${' '}
                {(selectedVehicle.salePriceCents / 100).toLocaleString(
                  'pt-BR',
                  { minimumFractionDigits: 2 },
                )}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="salesPersonId">Vendedor responsável *</Label>
            <select
              id="salesPersonId"
              name="salesPersonId"
              defaultValue={currentUserId}
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
            >
              {salesPeople.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Forma de pagamento *</Label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              required
              defaultValue="CASH"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="paymentNotes">Detalhes do pagamento</Label>
            <Textarea
              id="paymentNotes"
              name="paymentNotes"
              rows={2}
              placeholder="Ex: R$ 30k entrada + Santander 36x R$ 1.900"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasTradeIn"
              name="hasTradeIn"
              checked={hasTradeIn}
              onChange={(e) => setHasTradeIn(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="hasTradeIn" className="cursor-pointer">
              Cliente deu um carro de entrada (trade-in)
            </Label>
          </div>

          {hasTradeIn ? (
            <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tradeInBrand">Marca</Label>
                  <Input id="tradeInBrand" name="tradeInBrand" />
                </div>
                <div>
                  <Label htmlFor="tradeInModel">Modelo</Label>
                  <Input id="tradeInModel" name="tradeInModel" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="tradeInYear">Ano</Label>
                  <Input
                    id="tradeInYear"
                    name="tradeInYear"
                    type="number"
                    min={1900}
                    max={2100}
                  />
                </div>
                <div>
                  <Label htmlFor="tradeInMileageKm">KM</Label>
                  <Input
                    id="tradeInMileageKm"
                    name="tradeInMileageKm"
                    type="number"
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="tradeInPlate">Placa</Label>
                  <Input id="tradeInPlate" name="tradeInPlate" />
                </div>
              </div>
              <div>
                <Label htmlFor="tradeInValueReais">Valor avaliado (R$)</Label>
                <Input
                  id="tradeInValueReais"
                  name="tradeInValueReais"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="tradeInNotes">Observações do carro de troca</Label>
                <Textarea
                  id="tradeInNotes"
                  name="tradeInNotes"
                  rows={2}
                  placeholder="Ex: batidinha na porta traseira"
                />
              </div>
            </div>
          ) : null}

          <div>
            <Label htmlFor="contractNumber">Número do contrato</Label>
            <Input
              id="contractNumber"
              name="contractNumber"
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="notes">Observações da venda</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Registrando...' : 'Confirmar venda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
