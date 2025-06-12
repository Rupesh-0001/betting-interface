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

export async function GET() {
  try {
    const rounds = await prisma.round.findMany({
      include: {
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

    return NextResponse.json(rounds)
  } catch (error) {
    console.error('Error fetching rounds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    )
  }
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

    const user = session.user as SessionUser

    // Check if user is admin
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required to create rounds' },
        { status: 403 }
      )
    }

    const { title, description, optionA, optionB } = await request.json()

    if (!title || !optionA || !optionB) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const round = await prisma.round.create({
      data: {
        title,
        description,
        optionA,
        optionB,
      },
      include: {
        _count: {
          select: {
            bets: true,
          },
        },
      },
    })

    return NextResponse.json(round)
  } catch (error) {
    console.error('Error creating round:', error)
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    )
  }
} 