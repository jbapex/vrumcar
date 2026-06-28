import Link from 'next/link';
import { prisma } from '@/lib/db';
import { AcceptInviteForm } from '@/components/settings/accept-invite-form';

interface Props {
  params: Promise<{ token: string }>;
}

function getRoleLabel(role: string): string {
  if (role === 'SALES') return 'Vendedor';
  if (role === 'MANAGER') return 'Gerente';
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'FINANCE') return 'Financeiro';
  return 'Visualizador';
}

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true, slug: true } },
    },
  });

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-red-600">Convite inválido</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Este link de convite não existe ou já foi utilizado.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.acceptedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-zinc-800">Convite já aceito</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Este convite já foi utilizado. Faça login para acessar.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm text-purple-600 hover:underline"
          >
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  if (new Date() > invitation.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-red-600">Convite expirado</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Este convite expirou. Peça ao administrador para enviar um novo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-700">
            {invitation.organization.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-bold">
            Entrar em {invitation.organization.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Você foi convidado como{' '}
            <span className="font-medium">{getRoleLabel(invitation.role)}</span>
          </p>
        </div>

        <AcceptInviteForm
          token={token}
          email={invitation.email}
          orgName={invitation.organization.name}
        />
      </div>
    </div>
  );
}
