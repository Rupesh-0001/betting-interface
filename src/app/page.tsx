'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface Round {
  id: string
  title: string
  description?: string
  optionA: string
  optionB: string
  isActive: boolean
  winner?: string
  optionATotal: number
  optionBTotal: number
  totalPool: number
  _count: { bets: number }
}

interface UserProfile {
  id: string
  email: string
  name?: string
  credits: number
  bets: Array<{
    id: string
    option: string
    amount: number
    payout?: number
    round: {
      title: string
      optionA: string
      optionB: string
      winner?: string
      isActive: boolean
    }
  }>
}

export default function Home() {
  const { data: session, status } = useSession()
  const [rounds, setRounds] = useState<Round[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [betAmounts, setBetAmounts] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'rounds' | 'profile' | 'create'>('rounds')

  // New round form state
  const [newRound, setNewRound] = useState({
    title: '',
    description: '',
    optionA: '',
    optionB: ''
  })

  const fetchRounds = async () => {
    try {
      const response = await fetch('/api/rounds')
      if (response.ok) {
        const data = await response.json()
        setRounds(data)
      }
    } catch (error) {
      console.error('Error fetching rounds:', error)
    }
  }

  const fetchUserProfile = async () => {
    if (!session?.user) return
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  useEffect(() => {
    fetchRounds()
    if (session?.user) {
      fetchUserProfile()
    }
  }, [session])

  const placeBet = async (roundId: string, option: 'A' | 'B') => {
    if (!betAmounts[roundId] || betAmounts[roundId] <= 0) {
      alert('Please enter a valid bet amount')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          option,
          amount: betAmounts[roundId],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Bet placed successfully!')
        setBetAmounts(prev => ({ ...prev, [roundId]: 0 }))
        await Promise.all([fetchRounds(), fetchUserProfile()])
      } else {
        alert(data.error || 'Failed to place bet')
      }
    } catch (error) {
      console.error('Error placing bet:', error)
      alert('Failed to place bet')
    } finally {
      setLoading(false)
    }
  }

  const createRound = async () => {
    if (!newRound.title || !newRound.optionA || !newRound.optionB) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRound),
      })

      if (response.ok) {
        alert('Round created successfully!')
        setNewRound({ title: '', description: '', optionA: '', optionB: '' })
        setActiveTab('rounds')
        await fetchRounds()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create round')
      }
    } catch (error) {
      console.error('Error creating round:', error)
      alert('Failed to create round')
    } finally {
      setLoading(false)
    }
  }

  const completeRound = async (roundId: string, winner: 'A' | 'B') => {
    if (!confirm(`Are you sure you want to complete this round with option ${winner} as the winner?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/rounds/${roundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Round completed! Option ${winner} won!`)
        await Promise.all([fetchRounds(), fetchUserProfile()])
      } else {
        alert(data.error || 'Failed to complete round')
      }
    } catch (error) {
      console.error('Error completing round:', error)
      alert('Failed to complete round')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to Betting Interface</CardTitle>
            <CardDescription>
              Sign in with Google to start betting with 100 free credits!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => signIn('google')} 
              className="w-full"
            >
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userHasBetOnRound = (roundId: string) => {
    return userProfile?.bets.some(bet => bet.round && 
      rounds.find(round => round.id === roundId && bet.round.title === round.title)
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Betting Interface</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Credits: <strong>{userProfile?.credits || 0}</strong>
              </span>
              <span className="text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'rounds' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rounds')}
          >
            Active Rounds
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'outline'}
            onClick={() => setActiveTab('profile')}
          >
            My Bets
          </Button>
          <Button
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
          >
            Create Round
          </Button>
        </div>

        {/* Active Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Betting Rounds</h2>
              <Button onClick={fetchRounds} variant="outline" size="sm">
                Refresh
              </Button>
            </div>

            {rounds.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No betting rounds available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {rounds.map((round) => (
                  <Card key={round.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{round.title}</CardTitle>
                          {round.description && (
                            <CardDescription className="mt-1">
                              {round.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            round.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {round.isActive ? 'Active' : 'Completed'}
                          </div>
                          {!round.isActive && round.winner && (
                            <div className="mt-1 text-sm font-medium">
                              Winner: Option {round.winner}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Option A */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Option A: {round.optionA}</h4>
                          <div className="text-sm text-gray-600 mb-3">
                            Pool: {round.optionATotal} credits
                          </div>
                          {round.isActive && !userHasBetOnRound(round.id) && (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Bet amount"
                                min="1"
                                max={userProfile?.credits || 0}
                                value={betAmounts[round.id] || ''}
                                onChange={(e) => setBetAmounts(prev => ({
                                  ...prev,
                                  [round.id]: parseInt(e.target.value) || 0
                                }))}
                                className="flex-1"
                              />
                              <Button
                                onClick={() => placeBet(round.id, 'A')}
                                disabled={loading}
                                size="sm"
                              >
                                Bet A
                              </Button>
                            </div>
                          )}
                          {round.isActive && (
                            <Button
                              onClick={() => completeRound(round.id, 'A')}
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full"
                            >
                              Set as Winner
                            </Button>
                          )}
                        </div>

                        {/* Option B */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Option B: {round.optionB}</h4>
                          <div className="text-sm text-gray-600 mb-3">
                            Pool: {round.optionBTotal} credits
                          </div>
                          {round.isActive && !userHasBetOnRound(round.id) && (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Bet amount"
                                min="1"
                                max={userProfile?.credits || 0}
                                value={betAmounts[round.id] || ''}
                                onChange={(e) => setBetAmounts(prev => ({
                                  ...prev,
                                  [round.id]: parseInt(e.target.value) || 0
                                }))}
                                className="flex-1"
                              />
                              <Button
                                onClick={() => placeBet(round.id, 'B')}
                                disabled={loading}
                                size="sm"
                              >
                                Bet B
                              </Button>
                            </div>
                          )}
                          {round.isActive && (
                            <Button
                              onClick={() => completeRound(round.id, 'B')}
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full"
                            >
                              Set as Winner
                            </Button>
                          )}
                        </div>
                      </div>

                      {userHasBetOnRound(round.id) && round.isActive && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            You have already bet on this round
                          </p>
                        </div>
                      )}

                      <div className="mt-4 text-sm text-gray-500">
                        Total Pool: {round.totalPool} credits • {round._count.bets} bets
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Bets Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">My Betting History</h2>
            
            {userProfile?.bets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No bets placed yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userProfile?.bets.map((bet) => (
                  <Card key={bet.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{bet.round.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Bet on Option {bet.option}: {
                              bet.option === 'A' ? bet.round.optionA : bet.round.optionB
                            }
                          </p>
                          <p className="text-sm mt-1">
                            Amount: {bet.amount} credits
                          </p>
                          {bet.payout !== undefined && (
                            <p className="text-sm mt-1">
                              Payout: {bet.payout} credits
                              {bet.payout > 0 && (
                                <span className="text-green-600 ml-2">
                                  (+{bet.payout - bet.amount})
                                </span>
                              )}
                              {bet.payout === 0 && (
                                <span className="text-red-600 ml-2">
                                  (-{bet.amount})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            bet.round.isActive 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : bet.round.winner === bet.option
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {bet.round.isActive 
                              ? 'Pending' 
                              : bet.round.winner === bet.option 
                                ? 'Won' 
                                : 'Lost'
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Round Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Create New Betting Round</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Round Details</CardTitle>
                <CardDescription>
                  Create a new binary betting round where people can bet on one of two outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <Input
                    placeholder="e.g., Who will win the match?"
                    value={newRound.title}
                    onChange={(e) => setNewRound(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Input
                    placeholder="Optional description or context"
                    value={newRound.description}
                    onChange={(e) => setNewRound(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Option A *
                    </label>
                    <Input
                      placeholder="e.g., Team Alpha"
                      value={newRound.optionA}
                      onChange={(e) => setNewRound(prev => ({ ...prev, optionA: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Option B *
                    </label>
                    <Input
                      placeholder="e.g., Team Beta"
                      value={newRound.optionB}
                      onChange={(e) => setNewRound(prev => ({ ...prev, optionB: e.target.value }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={createRound}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Round'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
