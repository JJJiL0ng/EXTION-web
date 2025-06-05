import { ctaData } from '@/components/lending/data/cta'

// SSG로 렌더링되는 CTA 섹션 헤더
export function CTAHeader() {
  return (
    <div className="text-center mb-4">
      {/* 런칭 발표 박스 - 새로 추가 */}
      {/* <div className="max-w-md mx-auto mb-6">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 mb-4 transform hover:scale-105 transition-transform duration-300">
          <div className="text-white">
            <h3 className="text-lg font-bold mb-1">{ctaData.launch.announcement.title}</h3>
            <p className="text-sm opacity-90">{ctaData.launch.announcement.subtitle}</p>
            <div className="mt-2 text-3xl font-black">{ctaData.launch.announcement.highlight}</div>
          </div>
        </div>
      </div> */}

      {/* 베지 */}
      <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
        <span className="text-white text-sm font-medium">{ctaData.header.badge}</span>
      </div>
      
      {/* 메인 제목 - SEO 최적화 */}
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
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
        <meta itemProp="validThrough" content={ctaData.launch.date} />
        
        {/* SEO 키워드 */}
        <meta itemProp="keywords" content={ctaData.seoKeywords.join(', ')} />
        
        {/* 런칭 날짜 정보 추가 */}
        <meta itemProp="availabilityStarts" content={ctaData.launch.date} />
        
        {/* 판매자 정보 */}
        <div itemProp="seller" itemScope itemType="https://schema.org/Organization">
          <meta itemProp="name" content="Extion" />
          <meta itemProp="url" content="https://extion.app" />
        </div>
      </div>
    </div>
  )
} 