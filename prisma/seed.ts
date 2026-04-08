import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emptyFeatures = {} as const;

async function main() {
  const plans = [
    {
      slug: 'starter',
      name: 'Starter',
      monthlyPriceCents: 9_900,
      yearlyPriceCents: 99_000,
      maxUsers: 3,
      maxVehicles: 50,
      maxWhatsappMsgs: 1_000,
    },
    {
      slug: 'pro',
      name: 'Pro',
      monthlyPriceCents: 19_900,
      yearlyPriceCents: 199_000,
      maxUsers: 10,
      maxVehicles: 200,
      maxWhatsappMsgs: 5_000,
    },
    {
      slug: 'enterprise',
      name: 'Enterprise',
      monthlyPriceCents: 49_900,
      yearlyPriceCents: 499_000,
      maxUsers: 50,
      maxVehicles: 999_999,
      maxWhatsappMsgs: 20_000,
    },
  ] as const;

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        monthlyPriceCents: p.monthlyPriceCents,
        yearlyPriceCents: p.yearlyPriceCents,
        maxUsers: p.maxUsers,
        maxVehicles: p.maxVehicles,
        maxWhatsappMsgs: p.maxWhatsappMsgs,
        features: emptyFeatures,
        isPublic: true,
      },
      update: {
        name: p.name,
        monthlyPriceCents: p.monthlyPriceCents,
        yearlyPriceCents: p.yearlyPriceCents,
        maxUsers: p.maxUsers,
        maxVehicles: p.maxVehicles,
        maxWhatsappMsgs: p.maxWhatsappMsgs,
        features: emptyFeatures,
        isPublic: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
