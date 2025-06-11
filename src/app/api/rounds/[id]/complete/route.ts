import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { winner } = await request.json()
    const roundId = params.id

    if (winner !== 'A' && winner !== 'B') {
      return NextResponse.json({ error: 'Invalid winner' }, { status: 400 })
    }

    // Get round with all bets
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { bets: true },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    // Calculate pools
    const winningBets = round.bets.filter(bet => bet.option === winner)
    const losingBets = round.bets.filter(bet => bet.option !== winner)
    
    const winningPool = winningBets.reduce((sum, bet) => sum + bet.amount, 0)
    const losingPool = losingBets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalPool = winningPool + losingPool

    if (winningBets.length === 0) {
      // No winners, return all money
      return NextResponse.json({ error: 'No winning bets found' }, { status: 400 })
    }

    // Calculate payouts for winners
    const payoutUpdates = []
    const userUpdates = []

    for (const bet of winningBets) {
      const payout = Math.floor((bet.amount / winningPool) * totalPool)
      payoutUpdates.push(
        prisma.bet.update({
          where: { id: bet.id },
          data: { payout },
        })
      )
      
      // Update user credits
      const user = await prisma.user.findUnique({
        where: { id: bet.userId },
      })
      if (user) {
        userUpdates.push(
          prisma.user.update({
            where: { id: bet.userId },
            data: { credits: user.credits + payout },
          })
        )
      }
    }

    // Update losing bets with 0 payout
    for (const bet of losingBets) {
      payoutUpdates.push(
        prisma.bet.update({
          where: { id: bet.id },
          data: { payout: 0 },
        })
      )
    }

    // Execute all updates in a transaction
    await prisma.$transaction([
      prisma.round.update({
        where: { id: roundId },
        data: {
          winner,
        },
      }),
      ...payoutUpdates,
      ...userUpdates,
    ])

    return NextResponse.json({ 
      success: true, 
      winner,
      winningBets: winningBets.length,
      totalPayout: totalPool,
    })
  } catch (error) {
    console.error('Error completing round:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 