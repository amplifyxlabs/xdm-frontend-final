// File: app/api/auth/[...nextauth]/authOptions.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { ObjectId } from 'mongodb';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
    }
  }
}


export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID! || 'ABC',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET! || 'ABC',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          provider: 'credentials'
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        return false;
      }

      try {
        if (account?.provider === 'google') {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (existingUser) {
            return true;
          }

          // Create new user with MongoDB ObjectId
          const newUser = await prisma.user.create({
            data: {
              id: new ObjectId().toString(),
              email: user.email,
              name: user.name || '',
              image: user.image,
              provider: 'google',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Send welcome email for new Google sign-ups
          try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firstName: user.name?.split(' ')[0] || 'User',
                email: user.email,
              }),
            });
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Continue with sign-in even if email fails
          }

          return true;
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      if (trigger === 'signIn' && user && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.provider = dbUser.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const dbUser = await prisma.user.findFirst({
          where: { id: token.id as string }
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.provider = dbUser.provider || 'google';
          session.user.email = dbUser.email;
          session.user.name = dbUser.name || null;
          session.user.image = dbUser.image || null;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/?error=AuthError',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
};
