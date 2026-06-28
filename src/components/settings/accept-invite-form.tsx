'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  token: string;
  email: string;
  orgName: string;
}

export function AcceptInviteForm({ token, email, orgName }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Senhas não conferem');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error ?? `Erro ${resp.status}`);
      }

      router.push('/login?invited=true');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao aceitar convite',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Seu nome
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como quer ser chamado"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Criar senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          required
          minLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Confirmar senha
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a senha"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? 'Entrando...' : `Entrar em ${orgName}`}
      </button>
    </form>
  );
}
