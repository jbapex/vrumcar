import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logoutAction } from './actions';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <p className="text-lg text-zinc-800">
        Olá, {session.user.email}! Você está logado.
      </p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
