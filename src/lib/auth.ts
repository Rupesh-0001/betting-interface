import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user) {
        session.user.id = user.id
        
        // Get user credits from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true }
        })
        
        if (dbUser) {
          session.user.credits = dbUser.credits
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
} 