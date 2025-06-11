import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production seeding...')

  // Check if there are any existing rounds
  const existingRounds = await prisma.round.count()
  
  if (existingRounds > 0) {
    console.log('✅ Database already has data, skipping seed.')
    return
  }

  console.log('📊 Creating sample betting rounds...')

  // Create sample rounds
  const sampleRounds = [
    {
      title: 'Bitcoin Price by End of Year',
      description: 'Will Bitcoin be above $50,000 by December 31st?',
      optionA: 'Above $50,000',
      optionB: 'Below $50,000',
      isActive: true,
    },
    {
      title: 'Next Tech IPO Success',
      description: 'Will the next major tech IPO be valued above $10B?',
      optionA: 'Yes, above $10B',
      optionB: 'No, below $10B',
      isActive: true,
    },
    {
      title: 'AI Breakthrough',
      description: 'Will there be a major AI breakthrough announcement this quarter?',
      optionA: 'Yes, major breakthrough',
      optionB: 'No breakthrough',
      isActive: true,
    },
  ]

  for (const roundData of sampleRounds) {
    const round = await prisma.round.create({
      data: roundData,
    })
    console.log(`✅ Created round: ${round.title}`)
  }

  console.log('🎉 Production seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 