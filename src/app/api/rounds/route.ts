import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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