import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false
      
      // Create or update user in database
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          image: user.image,
        },
        create: {
          email: user.email,
          name: user.name,
          image: user.image,
          credits: 100,
        },
      })
      
      return true
    },
    async session({ session }) {
      if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, credits: true }
        })
        
        if (dbUser) {
          (session.user as any).id = dbUser.id
          (session.user as any).credits = dbUser.credits
        }
      }
      return session
    },
  },
} 