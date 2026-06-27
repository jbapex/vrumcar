import { addCostAction, removeCostAction } from '@/app/[orgSlug]/vehicles/actions';
import {
  formFieldClass,
  formGridClass,
  formNativeSelectClass,
  moduleInnerCardClass,
} from '@/components/layout/module-form';
import {
  ListPageEmpty,
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableHeadCell,
  ListTableHeader,
  ListTableRow,
  ListTableWrap,
} from '@/components/layout/list-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReaisInput } from '@/components/ui/reais-input';
import { Label } from '@/components/ui/label';
import { formatDate, formatPriceBRL } from '@/lib/format';
import { calculateMargin } from '@/modules/vehicles/service';
import type { Vehicle, VehicleCost } from '@prisma/client';

const COST_TYPES: { value: string; label: string }[] = [
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'TRANSFER', label: 'Transferência DETRAN' },
  { value: 'MECHANIC', label: 'Mecânica' },
  { value: 'BODYWORK', label: 'Funilaria / pintura' },
  { value: 'DETAILING', label: 'Estética' },
  { value: 'INSPECTION', label: 'Vistoria' },
  { value: 'PHOTOS', label: 'Fotografia' },
  { value: 'CLEANING', label: 'Limpeza' },
  { value: 'OTHER', label: 'Outras' },
];

type VehicleCostsPanelProps = {
  orgSlug: string;
  vehicle: Vehicle & { costs: VehicleCost[] };
};

export function VehicleCostsPanel({ orgSlug, vehicle }: VehicleCostsPanelProps) {
  const sumExpenses = vehicle.costs.reduce((s, c) => s + c.amountCents, 0);
  const acquisition = vehicle.acquisitionCostCents ?? 0;
  const totalCost = acquisition + sumExpenses;
  const margin = calculateMargin({
    salePriceCents: vehicle.salePriceCents,
    acquisitionCostCents: vehicle.acquisitionCostCents,
    costs: vehicle.costs,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <div className={moduleInnerCardClass}>
          <h3 className="mb-3 text-sm font-semibold">Adicionar custo</h3>
          <form
            action={addCostAction.bind(null, orgSlug, vehicle.id)}
            className={formGridClass}
          >
              <div className={formFieldClass}>
                <Label htmlFor="cost-type">Tipo</Label>
                <select
                  id="cost-type"
                  name="type"
                  required
                  className={formNativeSelectClass}
                >
                  {COST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={formFieldClass}>
                <Label htmlFor="cost-amount">Valor (R$)</Label>
                <ReaisInput
                  id="cost-amount"
                  name="amountReais"
                  required
                />
              </div>
              <div className={`${formFieldClass} sm:col-span-2`}>
                <Label htmlFor="cost-desc">Descrição</Label>
                <Input
                  id="cost-desc"
                  name="description"
                  required
                  maxLength={200}
                />
              </div>
              <div className="flex items-end sm:col-span-2">
                <Button type="submit" size="sm">
                  Adicionar
                </Button>
              </div>
            </form>
        </div>

        {vehicle.costs.length === 0 ? (
          <ListPageEmpty className="py-8">
            <p className="text-center text-xs">Nenhum custo lançado.</p>
          </ListPageEmpty>
        ) : (
          <ListTableWrap>
            <ListTable>
              <ListTableHeader>
                <ListTableHeadCell>Data</ListTableHeadCell>
                <ListTableHeadCell>Tipo</ListTableHeadCell>
                <ListTableHeadCell>Descrição</ListTableHeadCell>
                <ListTableHeadCell className="text-right">Valor</ListTableHeadCell>
                <ListTableHeadCell className="w-20">{' '}</ListTableHeadCell>
              </ListTableHeader>
              <ListTableBody>
                {vehicle.costs.map((c) => (
                  <ListTableRow key={c.id}>
                    <ListTableCell>{formatDate(c.occurredAt)}</ListTableCell>
                    <ListTableCell>
                      {COST_TYPES.find((x) => x.value === c.type)?.label ??
                        c.type}
                    </ListTableCell>
                    <ListTableCell>{c.description}</ListTableCell>
                    <ListTableCell className="text-right">
                      {formatPriceBRL(c.amountCents)}
                    </ListTableCell>
                    <ListTableCell>
                      <form
                        action={removeCostAction.bind(
                          null,
                          orgSlug,
                          c.id,
                          vehicle.id,
                        )}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          Remover
                        </Button>
                      </form>
                    </ListTableCell>
                  </ListTableRow>
                ))}
              </ListTableBody>
            </ListTable>
          </ListTableWrap>
        )}
      </div>

      <div className={`${moduleInnerCardClass} h-fit space-y-2 text-xs`}>
        <h3 className="text-sm font-semibold">Resumo</h3>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Aquisição</span>
          <span>{formatPriceBRL(vehicle.acquisitionCostCents)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Despesas</span>
          <span>{formatPriceBRL(sumExpenses)}</span>
        </div>
        <div className="flex justify-between gap-2 font-medium">
          <span>Custo total</span>
          <span>{formatPriceBRL(totalCost)}</span>
        </div>
        <div className="border-t border-border/50 pt-2">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Preço de venda</span>
            <span>{formatPriceBRL(vehicle.salePriceCents)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Margem bruta</span>
            <span>
              {margin ? formatPriceBRL(margin.marginCents) : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">% margem</span>
            <span>
              {margin ? `${margin.marginPercent.toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
