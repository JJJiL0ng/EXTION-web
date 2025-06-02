import { ctaData } from '@/data/cta'

// SSG로 렌더링되는 CTA 섹션 헤더
export function CTAHeader() {
  return (
    <div className="text-center mb-12">
      {/* 베지 */}
      <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
        <span className="text-white text-sm font-medium">{ctaData.header.badge}</span>
      </div>
      
      {/* 메인 제목 - SEO 최적화 */}
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
        {ctaData.header.title}
        <span className="block text-yellow-300">{ctaData.header.highlight}</span>
      </h2>
      
      {/* 서브타이틀 */}
      <p className="text-xl text-blue-100 mb-8">
        {ctaData.header.subtitle}
      </p>
      
      {/* 구조화된 데이터 - 숨겨진 SEO 정보 */}
      <div className="hidden" itemScope itemType="https://schema.org/Offer">
        <meta itemProp="name" content={`${ctaData.header.title} ${ctaData.header.highlight}`} />
        <meta itemProp="description" content={ctaData.header.subtitle} />
        <meta itemProp="price" content="0" />
        <meta itemProp="priceCurrency" content="KRW" />
        <meta itemProp="availability" content="https://schema.org/InStock" />
        <meta itemProp="validThrough" content="2025-12-31" />
        
        {/* SEO 키워드 */}
        <meta itemProp="keywords" content={ctaData.seoKeywords.join(', ')} />
        
        {/* 판매자 정보 */}
        <div itemProp="seller" itemScope itemType="https://schema.org/Organization">
          <meta itemProp="name" content="Extion" />
          <meta itemProp="url" content="https://extion.app" />
        </div>
      </div>
    </div>
  )
} 