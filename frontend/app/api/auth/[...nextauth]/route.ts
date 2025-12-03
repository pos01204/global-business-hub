import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// 허용된 이메일 도메인
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'backpackr.kr')
  .split(',')
  .map(d => d.trim().toLowerCase())

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    // 로그인 시 도메인 검증
    async signIn({ user }) {
      if (!user.email) {
        return false
      }
      
      const emailDomain = user.email.split('@')[1]?.toLowerCase()
      
      if (ALLOWED_DOMAINS.includes(emailDomain)) {
        return true
      }
      
      // 허용되지 않은 도메인
      return '/login?error=unauthorized_domain'
    },
    
    // 세션에 사용자 정보 추가
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    
    // JWT 토큰 설정
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
