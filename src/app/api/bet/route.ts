import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as SessionUser).id

    const { roundId, option, amount } = await request.json()

    if (!roundId || !option || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    // Check if round exists and is active
    const round = await prisma.round.findUnique({
      where: { id: roundId },
    })

    if (!round || round.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Round not found or not active' },
        { status: 400 }
      )
    }

    // Check if round is locked
    if (round.locked) {
      return NextResponse.json(
        { error: 'Betting is locked for this round' },
        { status: 400 }
      )
    }

    // Check user's balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    // Ensure credits never go below 100
    if (user.credits - amount < 0) {
      return NextResponse.json(
        { error: "Insufficient credits. You can't bet more than you have." },
        { status: 400 }
      )
    }

    // Create bet and update user credits in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the bet
      const bet = await tx.bet.create({
        data: {
          userId,
          roundId,
          option,
          amount,
        },
      })

      // Update user credits
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: user.credits - amount,
        },
      })

      return bet
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error placing bet:', error)
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    )
  }
} 