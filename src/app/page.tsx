'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LogIn, LogOut, TrendingUp, User, Coins, Trophy, Lock, Unlock } from 'lucide-react'
import { isAdmin } from '@/lib/utils'

interface Round {
  id: string
  title: string
  description?: string
  optionA: string
  optionB: string
  status: string
  locked: boolean
  totalPoolA: number
  totalPoolB: number
  winner?: string
  _count: { bets: number }
}

interface UserProfile {
  credits: number
  bets: Array<{
    id: string
    option: string
    amount: number
    payout?: number
    round: {
      title: string
      status: string
      winner?: string
    }
  }>
}

interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  email: string
  credits: number
  totalBets: number
  totalBetAmount: number
  totalPayout: number
  netProfit: number
}

export default function Home() {
  const { data: session, status } = useSession()
  const [rounds, setRounds] = useState<Round[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateRound, setShowCreateRound] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [newRound, setNewRound] = useState({
    title: '',
    description: '',
    optionA: '',
    optionB: ''
  })

  const userIsAdmin = isAdmin(session?.user?.email)

  useEffect(() => {
    if (session) {
      fetchRounds()
      fetchUserProfile()
      if (userIsAdmin) {
        fetchLeaderboard()
      }
    }
  }, [session, userIsAdmin])

  const fetchRounds = async () => {
    try {
      const res = await fetch('/api/rounds')
      const data = await res.json()
      setRounds(data)
    } catch (error) {
      console.error('Error fetching rounds:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard')
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  const createRound = async () => {
    if (!newRound.title || !newRound.optionA || !newRound.optionB) return

    setLoading(true)
    try {
      const res = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRound)
      })

      if (res.ok) {
        setNewRound({ title: '', description: '', optionA: '', optionB: '' })
        setShowCreateRound(false)
        fetchRounds()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create round')
      }
    } catch (error) {
      console.error('Error creating round:', error)
      alert('Failed to create round')
    }
    setLoading(false)
  }

  const placeBet = async (roundId: string, option: string, amount: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, option, amount })
      })

      const result = await res.json()
      
      if (res.ok) {
        fetchRounds()
        fetchUserProfile()
        alert('Bet placed successfully!')
      } else {
        alert(result.error || 'Failed to place bet')
      }
    } catch (error) {
      console.error('Error placing bet:', error)
      alert('Failed to place bet')
    }
    setLoading(false)
  }

  const completeRound = async (roundId: string, winner: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rounds/${roundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner })
      })

      if (res.ok) {
        fetchRounds()
        fetchUserProfile()
        if (userIsAdmin) {
          fetchLeaderboard()
        }
        alert('Round completed successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to complete round')
      }
    } catch (error) {
      console.error('Error completing round:', error)
      alert('Failed to complete round')
    }
    setLoading(false)
  }

  const toggleRoundLock = async (roundId: string, locked: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rounds/${roundId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked })
      })

      if (res.ok) {
        fetchRounds()
        alert(`Round ${locked ? 'locked' : 'unlocked'} successfully!`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update round lock status')
      }
    } catch (error) {
      console.error('Error updating round lock status:', error)
      alert('Failed to update round lock status')
    }
    setLoading(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <TrendingUp className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Betting Interface
            </h1>
            <p className="text-gray-600">
              Sign in with Google to start betting
            </p>
          </div>
          <Button 
            onClick={() => signIn('google')}
            className="w-full"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Betting Interface
              </h1>
              {userIsAdmin && (
                <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                  Admin
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="flex items-center text-sm text-gray-600">
                  <Coins className="h-4 w-4 mr-1" />
                  <span className="font-medium">{userProfile.credits}</span>
                  <span className="ml-1">credits</span>
                </div>
              )}
              
              {userIsAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  Leaderboard
                </Button>
              )}
              
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">{session.user?.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Leaderboard */}
        {showLeaderboard && userIsAdmin && (
          <Card className="mb-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Leaderboard
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaderboard(false)}
              >
                Close
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Rank</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Credits</th>
                    <th className="text-left py-2">Total Bets</th>
                    <th className="text-left py-2">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.id} className="border-b">
                      <td className="py-2 font-medium">#{entry.rank}</td>
                      <td className="py-2">{entry.name}</td>
                      <td className="py-2 font-medium">{entry.credits}</td>
                      <td className="py-2">{entry.totalBets}</td>
                      <td className={`py-2 font-medium ${entry.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.netProfit >= 0 ? '+' : ''}{entry.netProfit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Active Rounds</h2>
          {userIsAdmin && (
            <Button onClick={() => setShowCreateRound(true)}>
              Create New Round
            </Button>
          )}
        </div>

        {/* Create Round Modal */}
        {showCreateRound && userIsAdmin && (
          <Card className="mb-8 p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Round</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Round title"
                value={newRound.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRound({...newRound, title: e.target.value})}
              />
              <Input
                placeholder="Description (optional)"
                value={newRound.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRound({...newRound, description: e.target.value})}
              />
              <Input
                placeholder="Option A"
                value={newRound.optionA}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRound({...newRound, optionA: e.target.value})}
              />
              <Input
                placeholder="Option B"
                value={newRound.optionB}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRound({...newRound, optionB: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="outline" onClick={() => setShowCreateRound(false)}>
                Cancel
              </Button>
              <Button onClick={createRound} disabled={loading}>
                Create Round
              </Button>
            </div>
          </Card>
        )}

        {/* Rounds Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rounds.map((round) => (
            <RoundCard
              key={round.id}
              round={round}
              onBet={placeBet}
              onComplete={completeRound}
              onToggleLock={toggleRoundLock}
              loading={loading}
              userBet={userProfile?.bets?.find(bet => bet.round.title === round.title)}
              isAdmin={userIsAdmin}
            />
          ))}
        </div>

        {rounds.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active rounds</h3>
            <p className="text-gray-600">
              {userIsAdmin ? 'Create a new round to start betting!' : 'No rounds available at the moment.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function RoundCard({ 
  round, 
  onBet, 
  onComplete, 
  onToggleLock,
  loading, 
  userBet,
  isAdmin
}: { 
  round: Round
  onBet: (roundId: string, option: string, amount: number) => void
  onComplete: (roundId: string, winner: string) => void
  onToggleLock: (roundId: string, locked: boolean) => void
  loading: boolean
  isAdmin: boolean
  userBet?: {
    id: string
    option: string
    amount: number
    payout?: number
    round: {
      title: string
      status: string
      winner?: string
    }
  }
}) {
  const [betAmounts, setBetAmounts] = useState({ A: 10, B: 10 })
  
  const totalPool = round.totalPoolA + round.totalPoolB
  const poolAPercentage = totalPool > 0 ? (round.totalPoolA / totalPool) * 100 : 0
  const poolBPercentage = totalPool > 0 ? (round.totalPoolB / totalPool) * 100 : 0

  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{round.title}</h3>
          {round.locked && (
            <span className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </span>
          )}
        </div>
        {round.description && (
          <p className="text-sm text-gray-600 mb-3">{round.description}</p>
        )}
        <div className="text-xs text-gray-500">
          Total bets: {round._count?.bets || 0} | Pool: {totalPool} credits
        </div>
      </div>

      {round.status === 'ACTIVE' && (
        <>
          {/* Option A */}
          <div className="mb-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{round.optionA}</span>
              <span className="text-sm text-gray-600">
                {round.totalPoolA} credits ({poolAPercentage.toFixed(1)}%)
              </span>
            </div>
            {!userBet && !round.locked && (
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="1"
                  value={betAmounts.A}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBetAmounts({...betAmounts, A: parseInt(e.target.value) || 1})}
                  className="flex-1"
                />
                <Button 
                  size="sm"
                  onClick={() => onBet(round.id, 'A', betAmounts.A)}
                  disabled={loading}
                >
                  Bet A
                </Button>
              </div>
            )}
          </div>

          {/* Option B */}
          <div className="mb-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{round.optionB}</span>
              <span className="text-sm text-gray-600">
                {round.totalPoolB} credits ({poolBPercentage.toFixed(1)}%)
              </span>
            </div>
            {!userBet && !round.locked && (
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="1"
                  value={betAmounts.B}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBetAmounts({...betAmounts, B: parseInt(e.target.value) || 1})}
                  className="flex-1"
                />
                <Button 
                  size="sm"
                  onClick={() => onBet(round.id, 'B', betAmounts.B)}
                  disabled={loading}
                >
                  Bet B
                </Button>
              </div>
            )}
          </div>

          {userBet && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                You bet {userBet.amount} credits on {userBet.option === 'A' ? round.optionA : round.optionB}
              </p>
            </div>
          )}

          {round.locked && !userBet && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                Betting is locked for this round
              </p>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="border-t pt-4 mt-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onToggleLock(round.id, !round.locked)}
                  disabled={loading}
                >
                  {round.locked ? (
                    <>
                      <Unlock className="h-3 w-3 mr-1" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Lock
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onComplete(round.id, 'A')}
                  disabled={loading}
                >
                  {round.optionA} Wins
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onComplete(round.id, 'B')}
                  disabled={loading}
                >
                  {round.optionB} Wins
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {round.status === 'COMPLETED' && (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 font-medium">
            Round Completed - {round.winner === 'A' ? round.optionA : round.optionB} Won!
          </p>
          {userBet?.payout && (
            <p className="text-sm text-green-700 mt-1">
              You won {userBet.payout} credits!
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
