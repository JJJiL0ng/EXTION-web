import type { Metadata } from 'next'
import { generateMetadata } from '@/lending-libs/seo'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import AuthProvider from '@/components/AuthProvider'
import ImmerSetup from '@/components/ImmerSetup'
import './globals.css'

export const metadata: Metadata = generateMetadata({
  title: '엑션 - 함수 몰라도 되는 엑셀 AI 도구',
  description: '자연어로 엑셀 작업하기. 말 한마디로 표 정리, 차트 생성, 데이터 추출까지 자동화',
  keywords: ['엑셀', '엑셀 AI', '엑셀 함수', '액샐 그래프', '엑셀 자동화' , '엑션' , 'extion' , '엑셀 Gpt']
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* 기본 구조화된 데이터 (JSON-LD) - 조직 정보 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Extion",
              "url": "https://extion.app",
              "logo": "https://extion.app/logo.png",
              "description": "자연어로 엑셀 작업을 자동화하는 AI 도구 개발사",
              "foundingDate": "2024",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@extion.app"
              },
              "sameAs": [
                "https://twitter.com/extion_app"
              ]
            })
          }}
        />
        
        {/* 웹사이트 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Extion",
              "url": "https://extion.app",
              "description": "자연어로 엑셀 작업을 자동화하는 AI 도구",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://extion.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <ImmerSetup />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}