import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CustomerForm } from '@/components/customers/customer-form';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function NewCustomerPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { orgSlug } = await params;
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });

  if (!org || org.memberships.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Novo cliente</h1>
        <Link href={`/${orgSlug}/customers`} className={buttonVariants({ variant: 'outline' })}>
          Voltar
        </Link>
      </div>
      <CustomerForm orgSlug={orgSlug} mode="create" />
    </div>
  );
}
