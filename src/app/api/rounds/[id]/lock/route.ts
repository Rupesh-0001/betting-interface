import { NextRequest, NextResponse } from "next/server"
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

    const user = session.user as SessionUser

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { locked } = await request.json()
    const params = await context.params
    const roundId = params.id

    // Check if round exists
    const round = await prisma.round.findUnique({
      where: { id: roundId },
    })

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      )
    }

    if (round.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only lock/unlock active rounds' },
        { status: 400 }
      )
    }

    // Update round lock status
    const updatedRound = await prisma.round.update({
      where: { id: roundId },
      data: { locked: Boolean(locked) },
    })

    return NextResponse.json(updatedRound)
  } catch (error) {
    console.error('Error updating round lock status:', error)
    return NextResponse.json(
      { error: 'Failed to update round lock status' },
      { status: 500 }
    )
  }
} 