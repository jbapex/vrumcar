import Link from 'next/link';
import { signupAction } from './actions';

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900">
          VrumCar
        </h1>
        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <form action={signupAction} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Seu nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Seu email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Senha (mínimo 8 caracteres)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label
              htmlFor="organizationName"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Nome da sua loja
            </label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              required
              className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Criar conta
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link href="/login" className="text-zinc-900 underline">
            Já tem conta? Entre aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
