import { HeroButtons } from './HeroButtons'
import { heroData } from '@/_components/lendingComponents/lending/data/hero'

// 서버에서 렌더링되는 정적 콘텐츠 - SSG 최적화
export function HeroContent() {
  return (
    <>
      {/* 메인 헤드라인 - SEO 최적화 */}
      <h1 className="font-bold text-black text-5xl sm:text-5xl md:text-6xl lg:text-[92px] leading-[1.1] lg:leading-[0.95em] tracking-tight lg:tracking-[-0.06em]">
        {heroData.headline.main}
      </h1>
      <h2 className="block font-bold text-black mb-6 -mt-2 text-3xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight lg:leading-none">
        {heroData.headline.highlight}
      </h2>

      {/* 서브 헤드라인 - 검색 엔진을 위한 키워드 포함 */}
      <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
        {heroData.headline.subtitle}<br />
        <strong>{heroData.headline.description}</strong>
      </p>

      {/* 핵심 가치 제안 - 구조화된 데이터 */}
      <div className="hidden" itemScope itemType="https://schema.org/SoftwareApplication">
        <meta itemProp="name" content="Extion" />
        <meta itemProp="description" content={`${heroData.headline.subtitle} ${heroData.headline.description}`} />
        <meta itemProp="applicationCategory" content="ProductivityApplication" />
        <meta itemProp="operatingSystem" content="Windows, macOS, Web" />

        {/* SEO를 위한 키워드 */}
        <span itemProp="keywords" content={heroData.seoKeywords.join(', ')} />

        {/* 핵심 기능들 */}
        {heroData.valuePropositions.map((vp, index) => (
          <span key={index} itemProp="featureList" content={vp.description} />
        ))}

        {/* 사용 예시들 */}
        {heroData.examples.map((example, index) => (
          <span key={index} itemProp="description" content={example} />
        ))}
      </div>

      {/* CTA 버튼들 - 인터랙티브 요소는 별도 컴포넌트 */}
      <HeroButtons />
    </>
  )
}