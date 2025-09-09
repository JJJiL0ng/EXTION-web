import { HeroSection } from '@/_components/lendingComponents/lending/sections/HeroSection'
import { FeatureSection } from '@/_components/lendingComponents/lending/sections/FeatureSection'
import { DeviceSection } from '@/_components/lendingComponents/lending/sections/DeviceSection'
import { ReviewSection } from '@/_components/lendingComponents/lending/sections/reviewSection'
import { CTASection } from '@/_components/lendingComponents/lending/sections/CTASection'
import { heroData, generateHeroStructuredData } from '@/_components/lendingComponents/lending/data/hero'
import { featuresData, generateFeaturesStructuredData, getAllFeatureKeywords } from '@/_components/lendingComponents/lending/data/features'
import { devicesData, generateDevicesStructuredData, getAllDeviceKeywords } from '@/_components/lendingComponents/lending/data/devices'
import { reviewsData, generateReviewsStructuredData, getAllReviewKeywords } from '@/_components/lendingComponents/lending/data/review'
import { ctaData, generateCTAStructuredData } from '@/_components/lendingComponents/lending/data/cta'
import type { Metadata } from 'next'

// SSG로 정적 데이터 미리 렌더링 + SEO 최적화
export async function generateMetadata(): Promise<Metadata> {
  // 모든 섹션의 키워드 통합
  const allKeywords = [
    ...heroData.seoKeywords,
    ...getAllFeatureKeywords(),
    ...getAllDeviceKeywords(),
    ...getAllReviewKeywords(),
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
  const reviewsStructuredData = generateReviewsStructuredData()
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

      {/* Review 섹션 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewsStructuredData)
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
        {/* Device 섹션 추가 - SSG로 처리 */}
        <ReviewSection />
        {/* <CTASection /> */}
        <DeviceSection />
        {/* Review 섹션 - 전환 직전 배치 */}
      </main>
    </>
  )
}