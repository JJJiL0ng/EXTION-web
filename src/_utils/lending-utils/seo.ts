import type { Metadata } from 'next'

interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  image = '/og-image.jpg',
  url = 'https://extion.app'
}: SEOProps): Metadata {
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Extion Team' }],
    creator: 'Extion',
    publisher: 'Extion',
    
    // Open Graph
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale: 'ko_KR',
      siteName: 'Extion'
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@extion_app'
    },
    
    // 기타 메타태그
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    
    // 검증 태그들
    verification: {
      google: 'google-verification-code',
      // naver: 'naver-verification-code'
    }
  }
}