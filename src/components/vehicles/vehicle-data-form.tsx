import type { Vehicle } from '@prisma/client';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import {
  createVehicleAction,
  updateVehicleAction,
} from '@/app/[orgSlug]/vehicles/actions';

function centsToReaisInput(cents: number | null | undefined): string {
  if (cents == null || cents === undefined) return '';
  return String(cents / 100);
}

type VehicleDataFormProps = {
  orgSlug: string;
  mode: 'create' | 'edit';
  vehicle?: Vehicle;
};

export function VehicleDataForm({ orgSlug, mode, vehicle }: VehicleDataFormProps) {
  const action =
    mode === 'create'
      ? createVehicleAction.bind(null, orgSlug)
      : updateVehicleAction.bind(null, orgSlug, vehicle!.id);

  const v = vehicle;

  return (
    <form action={action} className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identificação</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Marca *</Label>
            <Input
              id="brand"
              name="brand"
              required
              defaultValue={v?.brand}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modelo *</Label>
            <Input
              id="model"
              name="model"
              required
              defaultValue={v?.model}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="version">Versão</Label>
            <Input
              id="version"
              name="version"
              defaultValue={v?.version ?? ''}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Ano (fabricação)</Label>
            <Input
              id="year"
              name="year"
              type="number"
              defaultValue={v?.year ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelYear">Ano modelo</Label>
            <Input
              id="modelYear"
              name="modelYear"
              type="number"
              defaultValue={v?.modelYear ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licensePlate">Placa</Label>
            <Input
              id="licensePlate"
              name="licensePlate"
              defaultValue={v?.licensePlate ?? ''}
              maxLength={10}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Preço</h2>
        <p className="text-muted-foreground text-sm">
          Valores em reais (ex.: 45000 ou 45000.50). O sistema grava em centavos.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="salePriceReais">Preço de venda (R$) *</Label>
            <Input
              id="salePriceReais"
              name="salePriceReais"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={centsToReaisInput(v?.salePriceCents)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acquisitionCostReais">Custo de aquisição (R$)</Label>
            <Input
              id="acquisitionCostReais"
              name="acquisitionCostReais"
              type="number"
              step="0.01"
              min="0"
              defaultValue={centsToReaisInput(v?.acquisitionCostCents)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minPriceReais">Preço mínimo (R$)</Label>
            <Input
              id="minPriceReais"
              name="minPriceReais"
              type="number"
              step="0.01"
              min="0"
              defaultValue={centsToReaisInput(v?.minPriceCents)}
            />
          </div>
          {mode === 'edit' && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="priceReason">Motivo da alteração de preço (opcional)</Label>
              <Input
                id="priceReason"
                name="priceReason"
                placeholder="Ex.: Ajuste FIPE, promoção…"
              />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Detalhes técnicos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mileageKm">Quilometragem</Label>
            <Input
              id="mileageKm"
              name="mileageKm"
              type="number"
              min={0}
              defaultValue={v?.mileageKm ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType">Combustível</Label>
            <select
              id="fuelType"
              name="fuelType"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              defaultValue={v?.fuelType ?? ''}
            >
              <option value="">—</option>
              <option value="GASOLINE">Gasolina</option>
              <option value="ETHANOL">Álcool</option>
              <option value="FLEX">Flex</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRIC">Elétrico</option>
              <option value="HYBRID">Híbrido</option>
              <option value="CNG">GNV</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transmission">Câmbio</Label>
            <select
              id="transmission"
              name="transmission"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              defaultValue={v?.transmission ?? ''}
            >
              <option value="">—</option>
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automático</option>
              <option value="CVT">CVT</option>
              <option value="SEMI_AUTOMATIC">Semi-automático</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyType">Carroceria</Label>
            <select
              id="bodyType"
              name="bodyType"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              defaultValue={v?.bodyType ?? ''}
            >
              <option value="">—</option>
              <option value="HATCH">Hatch</option>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="PICKUP">Picape</option>
              <option value="MINIVAN">Minivan</option>
              <option value="COUPE">Cupê</option>
              <option value="CONVERTIBLE">Conversível</option>
              <option value="WAGON">Perua</option>
              <option value="VAN">Van</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              name="category"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              defaultValue={v?.category ?? ''}
            >
              <option value="">—</option>
              <option value="POPULAR">Popular</option>
              <option value="MEDIUM">Médio</option>
              <option value="LUXURY">Luxo</option>
              <option value="PREMIUM">Premium</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="engineSize">Motor (ex.: 1.0)</Label>
            <Input
              id="engineSize"
              name="engineSize"
              defaultValue={v?.engineSize ?? ''}
              maxLength={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doors">Portas</Label>
            <Input
              id="doors"
              name="doors"
              type="number"
              min={2}
              max={6}
              defaultValue={v?.doors ?? ''}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Visual</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="exteriorColor">Cor externa</Label>
            <Input
              id="exteriorColor"
              name="exteriorColor"
              defaultValue={v?.exteriorColor ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interiorColor">Cor interna</Label>
            <Input
              id="interiorColor"
              name="interiorColor"
              defaultValue={v?.interiorColor ?? ''}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Documentação</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chassisNumber">Chassi</Label>
            <Input
              id="chassisNumber"
              name="chassisNumber"
              defaultValue={v?.chassisNumber ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renavam">RENAVAM</Label>
            <Input id="renavam" name="renavam" defaultValue={v?.renavam ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fipeCode">Código FIPE</Label>
            <Input id="fipeCode" name="fipeCode" defaultValue={v?.fipeCode ?? ''} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Descrição</h2>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={v?.description ?? ''}
            maxLength={5000}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações internas</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={v?.notes ?? ''}
            maxLength={5000}
          />
        </div>
      </section>

      {mode === 'create' ? (
        <input type="hidden" name="status" value="AVAILABLE" />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">
          {mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
        </Button>
        <Link
          href={`/${orgSlug}/vehicles`}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
