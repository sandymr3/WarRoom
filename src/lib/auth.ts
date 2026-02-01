/**
 * NextAuth Configuration
 * Authentication setup with Prisma adapter
 */

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import prisma from '@/src/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Google OAuth (optional, configure in .env)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    
    // Email/Password Authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        
        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }
        
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )
        
        if (!passwordMatch) {
          throw new Error('Invalid email or password')
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/register',
  },
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'USER'
      }
      
      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) {
        return url
      }
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      return baseUrl + '/dashboard'
    },
  },
  
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.email) {
        // Could send welcome email here
        console.log(`New user signed up: ${user.email}`)
      }
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
}

export default authOptions
