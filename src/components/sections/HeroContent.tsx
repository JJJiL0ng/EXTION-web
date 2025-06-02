import { HeroButtons } from './HeroButtons'
import { heroData } from '@/data/hero'

// 서버에서 렌더링되는 정적 콘텐츠 - SSG 최적화
export function HeroContent() {
  return (
    <>
      {/* 메인 헤드라인 - SEO 최적화 */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
        {heroData.headline.main} <br />
        <span className="text-blue-600">{heroData.headline.highlight}</span>
      </h1>
      
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