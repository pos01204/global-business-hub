'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { BRAND_ASSETS } from '@/lib/brand-assets'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  // 이미 로그인된 경우 대시보드로 이동
  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'unauthorized_domain':
        return '허용되지 않은 이메일 도메인입니다. @backpac.kr 계정으로 로그인해주세요.'
      case 'OAuthAccountNotLinked':
        return '이미 다른 방식으로 가입된 이메일입니다.'
      case 'AccessDenied':
        return '접근이 거부되었습니다.'
      default:
        return error ? '로그인 중 오류가 발생했습니다.' : null
    }
  }

  const errorMessage = getErrorMessage(error)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <Image
          src={BRAND_ASSETS.loading.gif}
          alt="로딩 중..."
          width={120}
          height={120}
          className="object-contain"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 - 다크모드 대응 */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />
      
      {/* 배경 패턴 - 다크모드에서 더 밝게 */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{ 
          backgroundImage: `url('${BRAND_ASSETS.patterns.logoPattern}')`,
          backgroundSize: '250px',
          backgroundRepeat: 'repeat',
        }}
        aria-hidden="true"
      />
      
      {/* 장식 일러스트 (좌측 하단) - 접근성: aria-hidden */}
      <div className="absolute -bottom-16 -left-16 w-72 h-72 opacity-[0.12] dark:opacity-[0.15] pointer-events-none select-none" aria-hidden="true">
        <Image
          src={BRAND_ASSETS.concepts.flower}
          alt=""
          fill
          className="object-contain dark:brightness-110"
        />
      </div>
      
      {/* 장식 일러스트 (우측 상단) */}
      <div className="absolute -top-8 -right-8 w-56 h-56 opacity-[0.12] dark:opacity-[0.15] pointer-events-none select-none" aria-hidden="true">
        <Image
          src={BRAND_ASSETS.concepts.dessert}
          alt=""
          fill
          className="object-contain dark:brightness-110"
        />
      </div>
      
      {/* 추가 장식 (좌측 상단) */}
      <div className="absolute top-20 left-20 w-24 h-24 opacity-[0.08] dark:opacity-[0.12] pointer-events-none select-none hidden lg:block" aria-hidden="true">
        <Image
          src={BRAND_ASSETS.concepts.knitting}
          alt=""
          fill
          className="object-contain dark:brightness-110"
        />
      </div>
      
      {/* 추가 장식 (우측 하단) */}
      <div className="absolute bottom-20 right-20 w-32 h-32 opacity-[0.08] dark:opacity-[0.12] pointer-events-none select-none hidden lg:block" aria-hidden="true">
        <Image
          src={BRAND_ASSETS.concepts.interior}
          alt=""
          fill
          className="object-contain dark:brightness-110"
        />
      </div>

      {/* 로그인 카드 - 다크모드 대응 */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-2xl border border-white/50 dark:border-slate-700/50">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <Image
              src={BRAND_ASSETS.logo.appIcon512}
              alt="idus logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <span>i</span>
            <span className="text-[#F78C3A]">d</span>
            <span>us</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium ml-2">Global Business</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            사내 운영 도구에 접근하려면<br/>회사 계정으로 로그인하세요
          </p>
        </div>

        {/* 에러 메시지 - 다크모드 및 접근성 */}
        {errorMessage && (
          <div 
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <div className="w-6 h-6 flex-shrink-0 relative" aria-hidden="true">
              <Image
                src={BRAND_ASSETS.emotions.cheer}
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google 로그인 버튼 - 다크모드 및 접근성 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-[#F78C3A]/30 dark:hover:border-[#F78C3A]/50 transition-all shadow-sm hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-[#F78C3A] focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          aria-label="Google 계정으로 로그인"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            Google 계정으로 로그인
          </span>
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            @backpac.kr 이메일 계정만 접근 가능합니다
          </p>
        </div>
        
        {/* 하단 브랜드 장식 - 접근성: aria-hidden */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-4 opacity-40 dark:opacity-50" aria-hidden="true">
          <div className="w-8 h-8 relative">
            <Image src={BRAND_ASSETS.categories.craft} alt="" fill className="object-contain" />
          </div>
          <div className="w-8 h-8 relative">
            <Image src={BRAND_ASSETS.categories.beauty} alt="" fill className="object-contain" />
          </div>
          <div className="w-8 h-8 relative">
            <Image src={BRAND_ASSETS.categories.food} alt="" fill className="object-contain" />
          </div>
          <div className="w-8 h-8 relative">
            <Image src={BRAND_ASSETS.categories.art} alt="" fill className="object-contain" />
          </div>
          <div className="w-8 h-8 relative">
            <Image src={BRAND_ASSETS.categories.plant} alt="" fill className="object-contain" />
          </div>
        </div>
      </div>
    </div>
  )
}
