import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roundId, option, amount } = await request.json()

    if (!roundId || !option || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid bet data' }, { status: 400 })
    }

    if (option !== 'A' && option !== 'B') {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
    }

    // Check if round exists and is active
    const round = await prisma.round.findUnique({
      where: { id: roundId },
    })

    if (!round || !round.isActive) {
      return NextResponse.json({ error: 'Round not found or inactive' }, { status: 404 })
    }

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.credits < amount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Check if user already bet on this round
    const existingBet = await prisma.bet.findUnique({
      where: {
        userId_roundId: {
          userId: session.user.id,
          roundId: roundId,
        },
      },
    })

    if (existingBet) {
      return NextResponse.json({ error: 'You have already bet on this round' }, { status: 400 })
    }

    // Create bet and update user credits in a transaction
    const result = await prisma.$transaction([
      prisma.bet.create({
        data: {
          userId: session.user.id,
          roundId,
          option,
          amount,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { credits: user.credits - amount },
      }),
    ])

    return NextResponse.json({ bet: result[0], user: result[1] })
  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 