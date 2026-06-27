import type { Vehicle } from '@prisma/client';
import {
  AlignLeft,
  BadgeDollarSign,
  CarFront,
  FileText,
  Palette,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import {
  FormSection,
  formActionsClass,
  formFieldClass,
  formFieldCompactClass,
  formFieldFullClass,
  formFieldMediumClass,
  formGridClass,
  formNativeSelectClass,
} from '@/components/layout/module-form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReaisInput } from '@/components/ui/reais-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { cn } from '@/lib/utils';
import {
  createVehicleAction,
  updateVehicleAction,
} from '@/app/[orgSlug]/vehicles/actions';

const sectionIconProps = {
  strokeWidth: LUCIDE_STROKE_THIN,
  'aria-hidden': true as const,
};

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
    <form action={action} className="space-y-4">
      <FormSection
        title="Identificação"
        icon={<CarFront {...sectionIconProps} />}
      >
        <div className={formGridClass}>
          <div className={formFieldClass}>
            <Label htmlFor="brand">Marca *</Label>
            <Input
              id="brand"
              name="brand"
              required
              defaultValue={v?.brand}
              maxLength={50}
            />
          </div>
          <div className={formFieldClass}>
            <Label htmlFor="model">Modelo *</Label>
            <Input
              id="model"
              name="model"
              required
              defaultValue={v?.model}
              maxLength={100}
            />
          </div>
          <div className={formFieldClass}>
            <Label htmlFor="version">Versão</Label>
            <Input
              id="version"
              name="version"
              defaultValue={v?.version ?? ''}
              maxLength={100}
            />
          </div>
          <div className={cn(formFieldClass, formFieldCompactClass)}>
            <Label htmlFor="year">Ano (fabricação)</Label>
            <Input
              id="year"
              name="year"
              type="number"
              defaultValue={v?.year ?? ''}
            />
          </div>
          <div className={cn(formFieldClass, formFieldCompactClass)}>
            <Label htmlFor="modelYear">Ano modelo</Label>
            <Input
              id="modelYear"
              name="modelYear"
              type="number"
              defaultValue={v?.modelYear ?? ''}
            />
          </div>
          <div className={cn(formFieldClass, formFieldMediumClass)}>
            <Label htmlFor="licensePlate">Placa</Label>
            <Input
              id="licensePlate"
              name="licensePlate"
              defaultValue={v?.licensePlate ?? ''}
              maxLength={10}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Preço"
        description="Digite em reais; pontos e vírgulas são aplicados automaticamente. O sistema grava em centavos."
        icon={<BadgeDollarSign {...sectionIconProps} />}
      >
        <div className={formGridClass}>
          <div className={cn(formFieldClass, formFieldMediumClass)}>
            <Label htmlFor="salePriceReais">Preço de venda (R$) *</Label>
            <ReaisInput
              id="salePriceReais"
              name="salePriceReais"
              required
              defaultCents={v?.salePriceCents}
            />
          </div>
          <div className={cn(formFieldClass, formFieldMediumClass)}>
            <Label htmlFor="acquisitionCostReais">Custo de aquisição (R$)</Label>
            <ReaisInput
              id="acquisitionCostReais"
              name="acquisitionCostReais"
              defaultCents={v?.acquisitionCostCents}
            />
          </div>
          <div className={cn(formFieldClass, formFieldMediumClass)}>
            <Label htmlFor="minPriceReais">Preço mínimo (R$)</Label>
            <ReaisInput
              id="minPriceReais"
              name="minPriceReais"
              defaultCents={v?.minPriceCents}
            />
          </div>
          {mode === 'edit' && (
            <div className={cn(formFieldClass, formFieldFullClass)}>
              <Label htmlFor="priceReason">
                Motivo da alteração de preço (opcional)
              </Label>
              <Input
                id="priceReason"
                name="priceReason"
                placeholder="Ex.: Ajuste FIPE, promoção…"
              />
            </div>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Detalhes técnicos"
        icon={<Settings2 {...sectionIconProps} />}
      >
        <div className={formGridClass}>
          <div className={cn(formFieldClass, formFieldMediumClass)}>
            <Label htmlFor="mileageKm">Quilometragem</Label>
            <Input
              id="mileageKm"
              name="mileageKm"
              type="number"
              min={0}
              defaultValue={v?.mileageKm ?? ''}
            />
          </div>
          <div className={formFieldClass}>
            <Label htmlFor="fuelType">Combustível</Label>
            <select
              id="fuelType"
              name="fuelType"
              className={formNativeSelectClass}
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
          <div className={formFieldClass}>
            <Label htmlFor="transmission">Câmbio</Label>
            <select
              id="transmission"
              name="transmission"
              className={formNativeSelectClass}
              defaultValue={v?.transmission ?? ''}
            >
              <option value="">—</option>
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automático</option>
              <option value="CVT">CVT</option>
              <option value="SEMI_AUTOMATIC">Semi-automático</option>
            </select>
          </div>
          <div className={formFieldClass}>
            <Label htmlFor="bodyType">Carroceria</Label>
            <select
              id="bodyType"
              name="bodyType"
              className={formNativeSelectClass}
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
          <div className={formFieldClass}>
            <Label htmlFor="category">Categoria</Label>
            <select
              id="category"
              name="category"
              className={formNativeSelectClass}
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
          <div className={cn(formFieldClass, formFieldCompactClass)}>
            <Label htmlFor="engineSize">Motor (ex.: 1.0)</Label>
            <Input
              id="engineSize"
              name="engineSize"
              defaultValue={v?.engineSize ?? ''}
              maxLength={10}
            />
          </div>
          <div className={cn(formFieldClass, formFieldCompactClass)}>
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
      </FormSection>

      <FormSection title="Visual" icon={<Palette {...sectionIconProps} />}>
        <div className={formGridClass}>
          <div className={formFieldClass}>
            <Label htmlFor="exteriorColor">Cor externa</Label>
            <Input
              id="exteriorColor"
              name="exteriorColor"
              defaultValue={v?.exteriorColor ?? ''}
            />
          </div>
          <div className={formFieldClass}>
            <Label htmlFor="interiorColor">Cor interna</Label>
            <Input
              id="interiorColor"
              name="interiorColor"
              defaultValue={v?.interiorColor ?? ''}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Documentação" icon={<FileText {...sectionIconProps} />}>
        <div className={formGridClass}>
          <div className={cn(formFieldClass, 'xl:col-span-2')}>
            <Label htmlFor="chassisNumber">Chassi</Label>
            <Input
              id="chassisNumber"
              name="chassisNumber"
              defaultValue={v?.chassisNumber ?? ''}
            />
          </div>
          <div className={cn(formFieldClass, formFieldMediumClass)}>
            <Label htmlFor="renavam">RENAVAM</Label>
            <Input id="renavam" name="renavam" defaultValue={v?.renavam ?? ''} />
          </div>
          <div className={cn(formFieldClass, formFieldMediumClass)}>
            <Label htmlFor="fipeCode">Código FIPE</Label>
            <Input id="fipeCode" name="fipeCode" defaultValue={v?.fipeCode ?? ''} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Descrição" icon={<AlignLeft {...sectionIconProps} />}>
        <div className={formGridClass}>
          <div className={cn(formFieldClass, formFieldFullClass)}>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={v?.description ?? ''}
              maxLength={5000}
            />
          </div>
          <div className={cn(formFieldClass, formFieldFullClass)}>
            <Label htmlFor="notes">Observações internas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={v?.notes ?? ''}
              maxLength={5000}
            />
          </div>
        </div>
      </FormSection>

      {mode === 'create' ? (
        <input type="hidden" name="status" value="AVAILABLE" />
      ) : null}

      <div className={formActionsClass}>
        <Button type="submit" size="sm">
          {mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
        </Button>
        <Link
          href={`/${orgSlug}/vehicles`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
