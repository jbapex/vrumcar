'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { Customer } from '@prisma/client';
import {
  createCustomerAction,
  updateCustomerAction,
} from '@/app/[orgSlug]/customers/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : label}
    </Button>
  );
}

interface Props {
  orgSlug: string;
  mode: 'create' | 'edit';
  initial?: Customer;
}

export function CustomerForm({ orgSlug, mode, initial }: Props) {
  const boundCreate = createCustomerAction.bind(null, orgSlug);
  const boundUpdate =
    mode === 'edit' && initial
      ? updateCustomerAction.bind(null, orgSlug, initial.id)
      : null;

  const action = mode === 'create' ? boundCreate : boundUpdate!;

  const [name, setName] = useState(initial?.name ?? '');
  const [cpfCnpj, setCpfCnpj] = useState(initial?.cpfCnpj ?? '');
  const [rg, setRg] = useState(initial?.rg ?? '');
  const [birthDate, setBirthDate] = useState(
    initial?.birthDate != null
      ? initial.birthDate.toISOString().slice(0, 10)
      : '',
  );
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [phoneSecondary, setPhoneSecondary] = useState(
    initial?.phoneSecondary ?? '',
  );
  const [email, setEmail] = useState(initial?.email ?? '');
  const [addressStreet, setAddressStreet] = useState(
    initial?.addressStreet ?? '',
  );
  const [addressNumber, setAddressNumber] = useState(
    initial?.addressNumber ?? '',
  );
  const [addressComplement, setAddressComplement] = useState(
    initial?.addressComplement ?? '',
  );
  const [addressNeighborhood, setAddressNeighborhood] = useState(
    initial?.addressNeighborhood ?? '',
  );
  const [addressCity, setAddressCity] = useState(initial?.addressCity ?? '');
  const [addressState, setAddressState] = useState(
    initial?.addressState ?? '',
  );
  const [addressZip, setAddressZip] = useState(initial?.addressZip ?? '');
  const [occupation, setOccupation] = useState(initial?.occupation ?? '');
  const [monthlyIncomeReais, setMonthlyIncomeReais] = useState(
    initial?.monthlyIncomeCents != null
      ? String(initial.monthlyIncomeCents / 100)
      : '',
  );
  const [employerName, setEmployerName] = useState(
    initial?.employerName ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <form action={action} className="space-y-6">
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
              <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
              <Input
                id="cpfCnpj"
                name="cpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                name="rg"
                value={rg}
                onChange={(e) => setRg(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label htmlFor="phoneSecondary">Telefone secundário</Label>
              <Input
                id="phoneSecondary"
                name="phoneSecondary"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
              />
            </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label htmlFor="addressStreet">Logradouro</Label>
              <Input
                id="addressStreet"
                name="addressStreet"
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                name="addressNumber"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="addressComplement">Complemento</Label>
            <Input
              id="addressComplement"
              name="addressComplement"
              value={addressComplement}
              onChange={(e) => setAddressComplement(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="addressNeighborhood">Bairro</Label>
              <Input
                id="addressNeighborhood"
                name="addressNeighborhood"
                value={addressNeighborhood}
                onChange={(e) => setAddressNeighborhood(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="addressZip">CEP</Label>
              <Input
                id="addressZip"
                name="addressZip"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="addressCity">Cidade</Label>
              <Input
                id="addressCity"
                name="addressCity"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="addressState">UF</Label>
              <Input
                id="addressState"
                name="addressState"
                maxLength={2}
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profissional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="occupation">Profissão</Label>
            <Input
              id="occupation"
              name="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="monthlyIncomeReais">Renda mensal (R$)</Label>
              <Input
                id="monthlyIncomeReais"
                name="monthlyIncomeReais"
                type="number"
                min="0"
                step="0.01"
                value={monthlyIncomeReais}
                onChange={(e) => setMonthlyIncomeReais(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="employerName">Empregador</Label>
              <Input
                id="employerName"
                name="employerName"
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton
          label={mode === 'create' ? 'Criar cliente' : 'Salvar alterações'}
        />
      </div>
    </form>
  );
}
