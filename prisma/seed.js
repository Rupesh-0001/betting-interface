const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...');
  
  const round1 = await prisma.round.create({
    data: {
      title: 'Next.js vs React',
      description: 'Which framework will be more popular?',
      optionA: 'Next.js',
      optionB: 'React',
      status: 'ACTIVE',
    },
  });

  const round2 = await prisma.round.create({
    data: {
      title: 'Coffee vs Tea',
      description: 'The ultimate beverage showdown',
      optionA: 'Coffee',
      optionB: 'Tea',
      status: 'ACTIVE',
    },
  });

  console.log('Seed data created:', round1.id, round2.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());