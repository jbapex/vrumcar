'use client';

import { createChannelInstanceAction } from '@/app/[orgSlug]/channels/actions';
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
import { LUCIDE_STROKE_THIN } from '@/lib/ui/lucide';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Props {
  orgSlug: string;
  onCreated?: (instanceId: string) => void;
}

export function CreateChannelDialog({ orgSlug, onCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createChannelInstanceAction(orgSlug, formData);
        setOpen(false);
        setName('');
        router.refresh();
        if (result.instanceId && onCreated) {
          onCreated(result.instanceId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" size="pill" className="gap-2">
            <Plus className="size-4" strokeWidth={LUCIDE_STROKE_THIN} />
            Conectar WhatsApp
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar novo WhatsApp</DialogTitle>
          <DialogDescription>
            Dê um nome pra identificar essa conexão. Depois você vai escanear
            um QR code pra vincular o WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da instância</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: WhatsApp Vendas Principal"
              required
              minLength={2}
            />
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
              {isPending ? 'Criando...' : 'Criar e conectar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
