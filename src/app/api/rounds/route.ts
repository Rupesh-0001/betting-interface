import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rounds = await prisma.round.findMany({
      include: {
        bets: {
          select: {
            option: true,
            amount: true,
          },
        },
        _count: {
          select: {
            bets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate pool totals for each round
    const roundsWithPools = rounds.map(round => {
      const optionATotal = round.bets
        .filter(bet => bet.option === 'A')
        .reduce((sum, bet) => sum + bet.amount, 0)
      
      const optionBTotal = round.bets
        .filter(bet => bet.option === 'B')
        .reduce((sum, bet) => sum + bet.amount, 0)

      return {
        ...round,
        optionATotal,
        optionBTotal,
        totalPool: optionATotal + optionBTotal,
      }
    })

    return NextResponse.json(roundsWithPools)
  } catch (error) {
    console.error('Error fetching rounds:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, optionA, optionB } = await request.json()

    if (!title || !optionA || !optionB) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const round = await prisma.round.create({
      data: {
        title,
        description,
        optionA,
        optionB,
      },
    })

    return NextResponse.json(round)
  } catch (error) {
    console.error('Error creating round:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 