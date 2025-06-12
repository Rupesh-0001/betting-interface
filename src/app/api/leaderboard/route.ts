import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/utils"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as SessionUser

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get leaderboard data
    const leaderboard = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        bets: {
          select: {
            amount: true,
            payout: true,
          },
        },
      },
      orderBy: {
        credits: 'desc',
      },
    })

    // Calculate additional statistics
    const leaderboardWithStats = leaderboard.map((user, index) => {
      const totalBetAmount = user.bets.reduce((sum, bet) => sum + bet.amount, 0)
      const totalPayout = user.bets.reduce((sum, bet) => sum + (bet.payout || 0), 0)
      const netProfit = totalPayout - totalBetAmount

      return {
        rank: index + 1,
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        totalBets: user.bets.length,
        totalBetAmount,
        totalPayout,
        netProfit,
      }
    })

    return NextResponse.json(leaderboardWithStats)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
} 