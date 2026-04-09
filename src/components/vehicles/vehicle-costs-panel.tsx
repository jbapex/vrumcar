import { addCostAction, removeCostAction } from '@/app/[orgSlug]/vehicles/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar custo</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={addCostAction.bind(null, orgSlug, vehicle.id)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cost-type">Tipo</Label>
                <select
                  id="cost-type"
                  name="type"
                  required
                  className="border-input h-10 w-full rounded-md border px-3 text-sm"
                >
                  {COST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cost-desc">Descrição</Label>
                <Input id="cost-desc" name="description" required maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost-amount">Valor (R$)</Label>
                <Input
                  id="cost-amount"
                  name="amountReais"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit">Adicionar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Data</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-right">Valor</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {vehicle.costs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground p-4 text-center">
                    Nenhum custo lançado.
                  </td>
                </tr>
              ) : (
                vehicle.costs.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{formatDate(c.occurredAt)}</td>
                    <td className="p-2">
                      {COST_TYPES.find((x) => x.value === c.type)?.label ??
                        c.type}
                    </td>
                    <td className="p-2">{c.description}</td>
                    <td className="p-2 text-right">
                      {formatPriceBRL(c.amountCents)}
                    </td>
                    <td className="p-2">
                      <form
                        action={removeCostAction.bind(
                          null,
                          orgSlug,
                          c.id,
                          vehicle.id,
                        )}
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Remover
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
              {margin
                ? `${margin.marginPercent.toFixed(1)}%`
                : '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
