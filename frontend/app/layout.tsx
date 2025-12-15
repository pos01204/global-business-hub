import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Layout from '@/components/Layout'

// 브랜드 리소스 경로
const BRAND_PATH = '/brand/Rebranding Design Resources/Rebranding Design Resources'

export const metadata: Metadata = {
  title: 'idus Global - Operations Hub',
  description: '아이디어스 글로벌 비즈니스 통합 운영 허브 - 크로스보더 이커머스 및 글로벌 로지스틱스 대시보드',
  keywords: ['idus', '아이디어스', '글로벌', '물류', '이커머스', '대시보드'],
  authors: [{ name: 'idus Global Business Team' }],
  icons: {
    icon: [
      { url: `${BRAND_PATH}/02. Profile/icon.png`, sizes: '32x32', type: 'image/png' },
      { url: `${BRAND_PATH}/02. Profile/thm_idus_512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: `${BRAND_PATH}/02. Profile/appicon-1024.png`, sizes: '1024x1024', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'idus Global - Operations Hub',
    description: '아이디어스 글로벌 비즈니스 통합 운영 허브',
    siteName: 'idus Global',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 폰트 - 가변 폰트 (Dynamic Subset) */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
}
