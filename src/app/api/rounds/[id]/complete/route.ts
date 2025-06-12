import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { winningOption } = await request.json()
    const params = await context.params
    const roundId = params.id

    if (!winningOption || !['A', 'B'].includes(winningOption)) {
      return NextResponse.json(
        { error: 'Invalid winning option' },
        { status: 400 }
      )
    }

    // Check if round exists and is active
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        bets: true,
      },
    })

    if (!round || round.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Round not found or not active' },
        { status: 400 }
      )
    }

    // Calculate pools and distribute winnings
    const totalPoolA = round.bets
      .filter(bet => bet.option === 'A')
      .reduce((sum, bet) => sum + bet.amount, 0)
    
    const totalPoolB = round.bets
      .filter(bet => bet.option === 'B')
      .reduce((sum, bet) => sum + bet.amount, 0)
    
    const totalPool = totalPoolA + totalPoolB
    const winningPool = winningOption === 'A' ? totalPoolA : totalPoolB
    const winningBets = round.bets.filter(bet => bet.option === winningOption)

    if (winningPool === 0) {
      // No winning bets, just mark round as completed
      await prisma.round.update({
        where: { id: roundId },
        data: {
          status: 'COMPLETED',
          winner: winningOption,
        },
      })

      return NextResponse.json({ message: 'Round completed, no winners' })
    }

    // Calculate and distribute winnings
    const result = await prisma.$transaction(async (tx) => {
      // Update round status
      await tx.round.update({
        where: { id: roundId },
        data: {
          status: 'COMPLETED',
          winner: winningOption,
        },
      })

      // Distribute winnings to each winner
      for (const bet of winningBets) {
        const payout = Math.floor((bet.amount / winningPool) * totalPool)
        
        await tx.user.update({
          where: { id: bet.userId },
          data: {
            credits: {
              increment: payout,
            },
          },
        })

        await tx.bet.update({
          where: { id: bet.id },
          data: {
            payout,
          },
        })
      }

      return {
        totalPool,
        winningPool,
        winnersCount: winningBets.length,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error completing round:', error)
    return NextResponse.json(
      { error: 'Failed to complete round' },
      { status: 500 }
    )
  }
} 