import type { Metadata } from 'next'
import { generateMetadata } from '@/libs/seo'
import { Analytics } from '@vercel/analytics/react'
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
        {/* 구조화된 데이터 (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Extion",
              "description": "자연어로 엑셀 작업을 자동화하는 AI 도구",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Windows, macOS",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW",
                "description": "베타 무료 체험"
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}