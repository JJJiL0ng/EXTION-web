import type { Metadata } from 'next'
import { generateMetadata } from '@/_aaa_sheetChat/_utils/lending-utils/seo'
import { SpeedInsights } from "@vercel/speed-insights/next"
import QueryProvider from '@/_aaa_sheetChat/_providers/QueryProvider'
import './globals.css'

export const metadata: Metadata = generateMetadata({
  title: 'Extion.ai | Sheet AI agent',
  description: 'No Formulas Required. Work with Excel using natural language. Automate table organization, chart creation, and data extraction with just a single command',
  keywords: ['Excel', 'Excel AI', 'Excel formulas', 'Excel charts', 'Excel automation', 'Extion', 'Excel GPT', 'AI spreadsheet', 'data analysis']
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* 기본 구조화된 데이터 (JSON-LD) - 조직 정보 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Extion",
              "url": "https://extion.ai",
              "logo": "https://extion.ai/logo.png",
              "description": "AI tool company that automates Excel tasks with natural language",
              "foundingDate": "2024",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "jihong9412@gmail.com"
              },
              "sameAs": [
                "https://twitter.com/extion.official"
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
              "url": "https://extion.ai",
              "description": "AI tool that automates Excel tasks with natural language",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://extion.ai/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <QueryProvider>
          {children}
        </QueryProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}