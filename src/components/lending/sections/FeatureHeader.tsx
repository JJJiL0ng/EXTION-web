import { featuresData } from '@/components/lending/data/features'

// SSG로 렌더링되는 Feature 섹션 헤더
export function FeatureHeader() {
  return (
    <div className="text-center mb-16">
      {/* 메인 제목 - SEO 최적화 */}
      <h2 className="text-3xl md:text-3xl font-bold text-gray-900 mb-4">
        {featuresData.header.title}
      </h2>
      
      {/* 서브 제목 */}
      <p className="text-base md:text-xl text-gray-600 mb-6">
        {featuresData.header.subtitle}
      </p>
      
      {/* 상세 설명 - SEO용 - UI에서는 숨김 */}
      {/* <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
        {featuresData.header.description}
      </p> */}
      
      {/* 구조화된 데이터 - 숨겨진 SEO 정보 */}
      <div className="hidden" itemScope itemType="https://schema.org/ItemList">
        <meta itemProp="name" content={featuresData.header.title} />
        <meta itemProp="description" content={featuresData.header.description} />
        <meta itemProp="numberOfItems" content={featuresData.features.length.toString()} />
        
        {/* 각 기능의 키워드들 */}
        {featuresData.features.map((feature, index) => (
          <div key={feature.id} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <meta itemProp="position" content={(index + 1).toString()} />
            <div itemProp="item" itemScope itemType="https://schema.org/SoftwareFeature">
              <meta itemProp="name" content={feature.title} />
              <meta itemProp="description" content={feature.description} />
              <meta itemProp="keywords" content={feature.keywords.join(', ')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 