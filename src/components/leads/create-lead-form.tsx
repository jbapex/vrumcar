'use client';

import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import Link from 'next/link';
import { createLeadAction, checkDuplicatesAction } from '@/app/[orgSlug]/leads/actions';
import { LEAD_SOURCE_LABELS } from '@/lib/labels/leads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

type User = { id: string; name: string | null; email: string };
type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
};

type Duplicate = {
  id: string;
  name: string;
  matchedOn: 'phone' | 'email' | 'cpf';
};

interface Props {
  orgSlug: string;
  users: User[];
  vehicles: Vehicle[];
}

function FormActions({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push(`/${orgSlug}/leads`)}
        disabled={pending}
      >
        Cancelar
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? 'Criando...' : 'Criar lead'}
      </Button>
    </div>
  );
}

function matchedOnLabel(m: Duplicate['matchedOn']) {
  if (m === 'phone') return 'telefone';
  if (m === 'email') return 'email';
  return 'CPF';
}

export function CreateLeadForm({ orgSlug, users, vehicles }: Props) {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');

  const checkDupes = async () => {
    if (!phone && !email && !cpf) {
      setDuplicates([]);
      return;
    }
    const result = await checkDuplicatesAction(orgSlug, {
      phone: phone || undefined,
      email: email || undefined,
      cpf: cpf || undefined,
    });
    setDuplicates(result);
    if (result.length > 0) setShowDuplicateWarning(true);
  };

  const boundCreate = createLeadAction.bind(null, orgSlug);

  return (
    <form action={boundCreate} className="space-y-6">
      {showDuplicateWarning && duplicates.length > 0 ? (
        <Card className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-orange-900 dark:text-orange-100">
              <AlertTriangle className="h-4 w-4" />
              Possível lead duplicado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Encontramos {duplicates.length} lead(s) com dados parecidos:
            </p>
            <ul className="space-y-1 text-sm">
              {duplicates.map((dup) => (
                <li key={dup.id}>
                  •{' '}
                  <Link
                    href={`/${orgSlug}/leads/${dup.id}`}
                    target="_blank"
                    className="font-medium text-orange-900 underline dark:text-orange-100"
                    rel="noreferrer"
                  >
                    {dup.name}
                  </Link>{' '}
                  (encontrado por {matchedOnLabel(dup.matchedOn)})
                </li>
              ))}
            </ul>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Você pode continuar criando mesmo assim se for outra pessoa.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={checkDupes}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={checkDupes}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              onBlur={checkDupes}
              placeholder="Só dígitos"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Origem e atribuição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="source">Origem</Label>
              <select
                id="source"
                name="source"
                defaultValue="OTHER"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <select
                id="priority"
                name="priority"
                defaultValue="MEDIUM"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="HOT">Quente</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="sourceDetails">Detalhes da origem</Label>
            <Input
              id="sourceDetails"
              name="sourceDetails"
              placeholder="Ex: Post do dia 03/10"
            />
          </div>
          <div>
            <Label htmlFor="assignedToId">Atribuir a vendedor</Label>
            <select
              id="assignedToId"
              name="assignedToId"
              defaultValue=""
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem atribuição</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interesse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="interestVehicleId">Veículo de interesse</Label>
            <select
              id="interestVehicleId"
              name="interestVehicleId"
              defaultValue=""
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Sem veículo específico</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} {v.year ?? ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="interestDescription">Descrição do interesse</Label>
            <Textarea
              id="interestDescription"
              name="interestDescription"
              rows={3}
              placeholder="Ex: Procura SUV com ar condicionado"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="budgetMinReais">Orçamento mín (R$)</Label>
              <Input
                id="budgetMinReais"
                name="budgetMinReais"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="budgetMaxReais">Orçamento máx (R$)</Label>
              <Input
                id="budgetMaxReais"
                name="budgetMaxReais"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasTradeIn"
              name="hasTradeIn"
              className="h-4 w-4"
            />
            <Label htmlFor="hasTradeIn" className="cursor-pointer">
              Cliente tem carro pra dar de entrada
            </Label>
          </div>
          <div>
            <Label htmlFor="tradeInDescription">Descrição do carro de troca</Label>
            <Textarea
              id="tradeInDescription"
              name="tradeInDescription"
              rows={2}
              placeholder="Ex: Gol 2015, 80k km"
            />
          </div>
        </CardContent>
      </Card>

      <FormActions orgSlug={orgSlug} />
    </form>
  );
}
