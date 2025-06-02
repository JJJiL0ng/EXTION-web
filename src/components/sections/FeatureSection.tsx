import { FeatureHeader } from './FeatureHeader'
import { FeatureItem } from './FeatureItem'
import { featuresData, type Feature } from '@/data/features'

interface FeatureSectionProps {
  features?: Feature[]
}

// SSG 최적화된 Feature 섹션
export function FeatureSection({ features = featuresData.features }: FeatureSectionProps) {
  return (
    <section className="py-20 bg-gray-50" itemScope itemType="https://schema.org/ItemList">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* 헤더 섹션 - SSG 렌더링 */}
        <FeatureHeader />

        {/* 기능 목록 - SSG 렌더링 */}
        <div className="space-y-20">
          {features.map((feature, index) => (
            <FeatureItem 
              key={feature.id}
              feature={feature}
              index={index}
            />
          ))}
        </div>
        
        {/* 추가 SEO 정보 - 숨겨진 구조화된 데이터 */}
        <div className="hidden">
          <div itemScope itemType="https://schema.org/SoftwareApplication">
            <meta itemProp="name" content="Extion" />
            <meta itemProp="applicationCategory" content="ProductivityApplication" />
            <meta itemProp="description" content={featuresData.header.description} />
            
            {/* 모든 기능의 키워드 통합 */}
            <meta itemProp="keywords" content={
              featuresData.features
                .flatMap(f => f.keywords)
                .join(', ')
            } />
            
            {/* 모든 혜택 통합 */}
            {featuresData.features.flatMap(f => f.benefits).map((benefit, index) => (
              <meta key={index} itemProp="featureList" content={benefit} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}