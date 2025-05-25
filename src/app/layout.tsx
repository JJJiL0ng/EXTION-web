import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Extion - 함수 몰라도 돼. 그냥 말만 해.',
  description: '엑셀을 잘 몰라도 자연어로 표를 정리하고 수정할 수 있는 AI 도구. 복잡한 함수나 기능을 배우지 않고도 말로 요청하면 바로 실행됩니다.',
  keywords: '엑셀, Excel, AI, 자연어, 표 정리, 데이터 정리, 자동화, 생산성',
  authors: [{ name: 'Extion Team' }],
  creator: 'Extion',
  publisher: 'Extion',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://extion.co',
    siteName: 'Extion',
    title: 'Extion - 함수 몰라도 돼. 그냥 말만 해.',
    description: '엑셀을 잘 몰라도 자연어로 표를 정리하고 수정할 수 있는 AI 도구',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Extion - Excel AI Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Extion - 함수 몰라도 돼. 그냥 말만 해.',
    description: '엑셀을 잘 몰라도 자연어로 표를 정리하고 수정할 수 있는 AI 도구',
    images: ['/og-image.png'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#005DE9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="canonical" href="https://extion.co" />
        <meta name="google-site-verification" content="your-google-verification-code" />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}