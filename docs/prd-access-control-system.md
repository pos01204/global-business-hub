# Global Business Hub 접근 제어 시스템 PRD

## 1. 개요

### 1.1 배경
Global Business Hub는 매출 데이터, 고객 정보, 작가 정보 등 민감한 비즈니스 데이터를 다루는 내부 운영 도구입니다. 현재는 별도의 인증 없이 누구나 접근 가능한 상태로, 기본적인 접근 제어가 필요합니다.

### 1.2 목표
- **단순한 접근 제어**: 허가된 사용자만 시스템에 접근 가능
- **역할 분리 없음**: 접근 가능한 사용자는 모든 기능 사용 가능
- **Vercel/Railway 호환**: 현재 인프라 내에서 구현

### 1.3 범위
- ✅ 로그인/로그아웃 기능
- ✅ 허용된 이메일만 접근 가능
- ❌ 역할별 권한 분리 (불필요)
- ❌ 사용자 관리 페이지 (불필요)

---

## 2. 인증 방식 선택

### 2.1 옵션 비교

| 방식 | 장점 | 단점 | Vercel/Railway 호환 |
|------|------|------|---------------------|
| **A. NextAuth + Google OAuth** | 간편, 보안 강화 | Google 설정 필요 | ✅ |
| **B. 환경변수 비밀번호** | 매우 간단 | 공유 비밀번호 | ✅ |
| **C. 이메일 화이트리스트 + PIN** | 간단, 개인별 관리 | PIN 관리 필요 | ✅ |

### 2.2 권장 방식: B. 환경변수 비밀번호 (가장 간단)

**선택 이유:**
1. **구현 간단**: 환경변수 하나로 설정 완료
2. **외부 의존성 없음**: Google OAuth 설정 불필요
3. **Vercel/Railway 완벽 호환**: 환경변수만 설정하면 됨
4. **즉시 적용 가능**: 복잡한 설정 없이 바로 사용

---

## 3. 시스템 설계

### 3.1 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │ /login      │ ──▶ │ Auth Check  │ ──▶ │ Protected Pages │   │
│  │ 비밀번호 입력│     │ (Cookie)    │     │ /dashboard 등   │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ localStorage    │                          │
│                    │ 또는 Cookie     │                          │
│                    └─────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Railway)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │ POST /api/auth  │     │ 환경변수                         │   │
│  │ /verify         │ ──▶ │ ACCESS_PASSWORD=your-password   │   │
│  └─────────────────┘     └─────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 인증 플로우

```
1. 사용자가 사이트 접근
   │
2. 인증 상태 확인 (localStorage/Cookie)
   │
   ├─ 인증됨 → 요청한 페이지 표시
   │
   └─ 미인증 → /login 페이지로 리다이렉트
              │
3. 비밀번호 입력
   │
4. POST /api/auth/verify 호출
   │
5. 서버에서 환경변수와 비교
   │
   ├─ 일치 → 토큰 발급, 메인 페이지로 이동
   │
   └─ 불일치 → 에러 메시지 표시
```

---

## 4. 상세 설계

### 4.1 환경변수 설정

```env
# Frontend (.env.local 또는 Vercel 환경변수)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Backend (.env 또는 Railway 환경변수)
ACCESS_PASSWORD=your-secure-password-here
JWT_SECRET=your-jwt-secret-key
```

### 4.2 백엔드 API

```typescript
// backend/src/routes/auth.ts
import express from 'express'
import jwt from 'jsonwebtoken'

const router = express.Router()

// 비밀번호 검증
router.post('/verify', (req, res) => {
  const { password } = req.body
  
  if (password === process.env.ACCESS_PASSWORD) {
    // JWT 토큰 생성 (24시간 유효)
    const token = jwt.sign(
      { authenticated: true },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )
    
    res.json({ success: true, token })
  } else {
    res.status(401).json({ success: false, message: '비밀번호가 올바르지 않습니다.' })
  }
})

// 토큰 검증
router.get('/check', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ authenticated: false })
  }
  
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    res.json({ authenticated: true })
  } catch {
    res.status(401).json({ authenticated: false })
  }
})

export default router
```

### 4.3 프론트엔드 인증 컨텍스트

```typescript
// frontend/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // 초기 인증 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      verifyToken(token)
    } else {
      setIsLoading(false)
      if (pathname !== '/login') {
        router.push('/login')
      }
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('auth_token')
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    } catch {
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      if (res.ok) {
        const { token } = await res.json()
        localStorage.setItem('auth_token', token)
        setIsAuthenticated(true)
        router.push('/dashboard')
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### 4.4 로그인 페이지

```typescript
// frontend/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const success = await login(password)
    
    if (!success) {
      setError('비밀번호가 올바르지 않습니다.')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#F78C3A] to-[#E67729] rounded-2xl flex items-center justify-center">
            <span className="text-3xl text-white">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Global Business Hub</h1>
          <p className="text-slate-500 mt-2">내부 운영 도구에 접근하려면 비밀번호를 입력하세요</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              접근 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-[#F78C3A]"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-[#F78C3A] to-[#E67729] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? '확인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          비밀번호를 모르시면 관리자에게 문의하세요
        </p>
      </div>
    </div>
  )
}
```

### 4.5 인증 가드 (Layout 적용)

```typescript
// frontend/components/AuthGuard.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { Spinner } from '@/components/ui'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  // 로그인 페이지는 인증 불필요
  if (pathname === '/login') {
    return <>{children}</>
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // 미인증 시 로그인 페이지로 (리다이렉트는 AuthContext에서 처리)
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

---

## 5. UI/UX 설계

### 5.1 로그인 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │                     │                      │
│                    │    🏠               │                      │
│                    │                     │                      │
│                    │  Global Business    │                      │
│                    │       Hub           │                      │
│                    │                     │                      │
│                    │  내부 운영 도구에    │                      │
│                    │  접근하려면 비밀번호 │                      │
│                    │  를 입력하세요       │                      │
│                    │                     │                      │
│                    │  ┌───────────────┐  │                      │
│                    │  │ ************  │  │                      │
│                    │  └───────────────┘  │                      │
│                    │                     │                      │
│                    │  ┌───────────────┐  │                      │
│                    │  │    로그인     │  │                      │
│                    │  └───────────────┘  │                      │
│                    │                     │                      │
│                    │  비밀번호를 모르시면 │                      │
│                    │  관리자에게 문의하세요│                      │
│                    │                     │                      │
│                    └─────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 헤더 로그아웃 버튼

```
┌─────────────────────────────────────────────────────────────────┐
│ [검색...]                                    🔔  [🚪 로그아웃]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 구현 계획

### 6.1 Phase 1: 백엔드 인증 API (1일)
- [ ] `backend/src/routes/auth.ts` 생성
- [ ] POST `/api/auth/verify` - 비밀번호 검증
- [ ] GET `/api/auth/check` - 토큰 검증
- [ ] JWT 토큰 발급 로직
- [ ] Railway 환경변수 설정 (`ACCESS_PASSWORD`, `JWT_SECRET`)

### 6.2 Phase 2: 프론트엔드 인증 (1일)
- [ ] `frontend/contexts/AuthContext.tsx` 생성
- [ ] `frontend/app/login/page.tsx` 생성
- [ ] `frontend/components/AuthGuard.tsx` 생성
- [ ] Layout에 AuthProvider, AuthGuard 적용
- [ ] Vercel 환경변수 설정

### 6.3 Phase 3: UI 개선 (0.5일)
- [ ] 로그인 페이지 디자인 적용
- [ ] 헤더에 로그아웃 버튼 추가
- [ ] 로딩 상태 처리

### 6.4 Phase 4: 테스트 및 배포 (0.5일)
- [ ] 로컬 테스트
- [ ] Vercel/Railway 배포
- [ ] 프로덕션 테스트

**총 예상 소요 시간: 3일**

---

## 7. 환경변수 설정 가이드

### 7.1 Railway (백엔드)

1. Railway 대시보드 접속
2. 프로젝트 선택 → Variables 탭
3. 다음 환경변수 추가:

```
ACCESS_PASSWORD=your-secure-password-here
JWT_SECRET=your-random-secret-key-min-32-chars
```

### 7.2 Vercel (프론트엔드)

1. Vercel 대시보드 접속
2. 프로젝트 선택 → Settings → Environment Variables
3. 다음 환경변수 추가:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## 8. 보안 고려사항

### 8.1 구현된 보안
- [x] 비밀번호는 서버 환경변수에만 저장 (코드에 노출 안됨)
- [x] JWT 토큰으로 세션 관리 (24시간 만료)
- [x] HTTPS 통신 (Vercel/Railway 기본 제공)

### 8.2 권장 사항
- 비밀번호는 최소 12자 이상, 특수문자 포함
- JWT_SECRET은 32자 이상의 랜덤 문자열
- 주기적인 비밀번호 변경 (분기별 권장)

### 8.3 제한 사항
- 개인별 계정 관리 없음 (공유 비밀번호)
- 활동 로깅 없음
- 세션 강제 만료 기능 없음

---

## 9. 향후 확장 (필요시)

### 9.1 Google OAuth 추가
- 개인별 계정 관리 필요시
- 특정 도메인(@backpackr.kr) 제한 가능

### 9.2 역할 기반 권한
- 기능별 접근 제한 필요시
- Admin/Manager/Viewer 등 역할 분리

### 9.3 활동 로깅
- 감사 추적 필요시
- 로그인/주요 액션 기록

---

## 10. 파일 구조

```
frontend/
├── app/
│   ├── login/
│   │   └── page.tsx          # 로그인 페이지
│   └── layout.tsx            # AuthProvider, AuthGuard 적용
├── contexts/
│   └── AuthContext.tsx       # 인증 상태 관리
├── components/
│   └── AuthGuard.tsx         # 인증 가드 컴포넌트
└── lib/
    └── auth.ts               # 인증 유틸리티 (선택적)

backend/
├── src/
│   ├── routes/
│   │   └── auth.ts           # 인증 API
│   └── index.ts              # auth 라우터 등록
└── .env                      # ACCESS_PASSWORD, JWT_SECRET
```

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-02 | - | 초안 작성 |
| 1.1 | 2025-12-02 | - | 간소화: 역할 분리 제거, 환경변수 비밀번호 방식으로 변경 |
