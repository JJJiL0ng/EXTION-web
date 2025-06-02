import { HeroSection } from '@/components/sections/HeroSection'
import { FeatureSection } from '@/components/sections/FeatureSection'
import { DeviceSection } from '@/components/sections/DeviceSection'
import { CTASection } from '@/components/sections/CTASection'
import { heroData, generateHeroStructuredData } from '@/data/hero'
import { featuresData, generateFeaturesStructuredData, getAllFeatureKeywords } from '@/data/features'
import { devicesData, generateDevicesStructuredData, getAllDeviceKeywords } from '@/data/devices'
import { ctaData, generateCTAStructuredData } from '@/data/cta'
import type { Metadata } from 'next'

// SSG로 정적 데이터 미리 렌더링 + SEO 최적화
export async function generateMetadata(): Promise<Metadata> {
  // 모든 섹션의 키워드 통합
  const allKeywords = [
    ...heroData.seoKeywords,
    ...getAllFeatureKeywords(),
    ...getAllDeviceKeywords(),
    ...ctaData.seoKeywords
  ]

  return {
    title: `${heroData.headline.main} ${heroData.headline.highlight} | Extion`,
    description: `${heroData.headline.subtitle} ${heroData.headline.description}`,
    keywords: allKeywords.join(', '),
    openGraph: {
      title: `${heroData.headline.main} ${heroData.headline.highlight}`,
      description: heroData.headline.subtitle,
      images: [
        {
          url: heroData.video.poster,
          width: heroData.video.width,
          height: heroData.video.height,
          alt: heroData.video.title
        }
      ],
      videos: [
        {
          url: heroData.video.src,
          width: heroData.video.width,
          height: heroData.video.height,
          type: 'video/mp4'
        }
      ]
    },
    twitter: {
      card: 'player',
      title: `${heroData.headline.main} ${heroData.headline.highlight}`,
      description: heroData.headline.subtitle,
      images: [heroData.video.poster],
      players: [
        {
          playerUrl: heroData.video.src,
          streamUrl: heroData.video.src,
          width: heroData.video.width,
          height: heroData.video.height
        }
      ]
    }
  }
}

export default async function HomePage() {
  // 구조화된 데이터 생성 - SSG 최적화
  const heroStructuredData = generateHeroStructuredData()
  const featuresStructuredData = generateFeaturesStructuredData()
  const devicesStructuredData = generateDevicesStructuredData()
  const ctaStructuredData = generateCTAStructuredData()

  return (
    <>
      {/* 구조화된 데이터 (JSON-LD) - SEO 최적화 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(heroStructuredData)
        }}
      />
      
      {/* Feature 섹션 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(featuresStructuredData)
        }}
      />
      
      {/* Device 섹션 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(devicesStructuredData)
        }}
      />
      
      {/* CTA 섹션 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ctaStructuredData)
        }}
      />
      
      <main>
        <HeroSection />
        {/* Feature 데이터는 이제 컴포넌트 내부에서 SSG로 처리 */}
        <FeatureSection />
        <CTASection />
        {/* Device 섹션 추가 - SSG로 처리 */}
        <DeviceSection />
      </main>
    </>
  )
}