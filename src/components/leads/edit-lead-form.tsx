'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateLeadAction } from '@/app/[orgSlug]/leads/actions';
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from '@/lib/labels/leads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  LeadPriority,
  LeadSource,
  LeadStatus,
} from '@prisma/client';

type User = { id: string; name: string | null; email: string };
type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  salePriceCents: number;
};

export type EditLeadFormLead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  source: LeadSource;
  sourceDetails: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  assignedToId: string | null;
  interestVehicleId: string | null;
  interestDescription: string | null;
  hasTradeIn: boolean;
  tradeInDescription: string | null;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
};

interface Props {
  orgSlug: string;
  lead: EditLeadFormLead;
  users: User[];
  vehicles: Vehicle[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar alterações'}
    </Button>
  );
}

export function EditLeadForm({ orgSlug, lead, users, vehicles }: Props) {
  const boundUpdate = updateLeadAction.bind(null, orgSlug, lead.id);

  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [email, setEmail] = useState(lead.email ?? '');
  const [cpf, setCpf] = useState(lead.cpf ?? '');
  const [source, setSource] = useState<LeadSource>(lead.source);
  const [sourceDetails, setSourceDetails] = useState(lead.sourceDetails ?? '');
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [priority, setPriority] = useState<LeadPriority>(lead.priority);
  const [assignedToId, setAssignedToId] = useState(lead.assignedToId ?? '');
  const [interestVehicleId, setInterestVehicleId] = useState(
    lead.interestVehicleId ?? '',
  );
  const [interestDescription, setInterestDescription] = useState(
    lead.interestDescription ?? '',
  );
  const [hasTradeIn, setHasTradeIn] = useState(lead.hasTradeIn);
  const [tradeInDescription, setTradeInDescription] = useState(
    lead.tradeInDescription ?? '',
  );
  const [budgetMinReais, setBudgetMinReais] = useState(
    lead.budgetMinCents != null ? String(lead.budgetMinCents / 100) : '',
  );
  const [budgetMaxReais, setBudgetMaxReais] = useState(
    lead.budgetMaxCents != null ? String(lead.budgetMaxCents / 100) : '',
  );

  return (
    <form action={boundUpdate} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
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
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as LeadPriority)
                }
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
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sourceDetails">Detalhes da origem</Label>
            <Input
              id="sourceDetails"
              name="sourceDetails"
              value={sourceDetails}
              onChange={(e) => setSourceDetails(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="assignedToId">Atribuir a vendedor</Label>
            <select
              id="assignedToId"
              name="assignedToId"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
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
              value={interestVehicleId}
              onChange={(e) => setInterestVehicleId(e.target.value)}
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
              value={interestDescription}
              onChange={(e) => setInterestDescription(e.target.value)}
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
                value={budgetMinReais}
                onChange={(e) => setBudgetMinReais(e.target.value)}
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
                value={budgetMaxReais}
                onChange={(e) => setBudgetMaxReais(e.target.value)}
              />
            </div>
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
              Cliente tem carro pra dar de entrada
            </Label>
          </div>
          <div>
            <Label htmlFor="tradeInDescription">Descrição do carro de troca</Label>
            <Textarea
              id="tradeInDescription"
              name="tradeInDescription"
              rows={2}
              value={tradeInDescription}
              onChange={(e) => setTradeInDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
