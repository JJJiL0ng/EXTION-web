import { VideoPlayer } from '@/components/ui/VideoPlayer'
import type { Feature } from '@/data/features'

interface FeatureItemProps {
  feature: Feature
  index: number
}

// SSG로 렌더링되는 개별 Feature 아이템
export function FeatureItem({ feature, index }: FeatureItemProps) {
  const isReversed = index % 2 === 1

  return (
    <div 
      className={`flex flex-col lg:flex-row items-center gap-12 ${
        isReversed ? 'lg:flex-row-reverse' : ''
      }`}
      itemScope 
      itemType="https://schema.org/SoftwareFeature"
    >
      {/* 구조화된 데이터 - 기능 메타데이터 */}
      <meta itemProp="name" content={feature.title} />
      {/* <meta itemProp="description" content={feature.description} /> */}
      <meta itemProp="keywords" content={feature.keywords.join(', ')} />
      
      {/* 텍스트 영역 - SSG 렌더링 */}
      <div className="flex-1 space-y-2">
        {/* 아이콘과 제목 */}
        <div className="flex items-center gap-4">
          <span className="text-4xl" role="img" aria-label={feature.title}>
            {feature.icon}
          </span>
          <h3 className="text-3xl font-bold text-gray-900" itemProp="name">
            {feature.title}
          </h3>
        </div>
        
        {/* 서브타이틀 */}
        <h4 className="text-xl font-semibold text-blue-600">
          {feature.subtitle}
        </h4>
        
        {/* 설명 */}
        {/* <p className="text-lg text-gray-600 leading-relaxed" itemProp="description">
          {feature.description}
        </p> */}
        
        {/* 혜택 목록 - SEO 최적화 */}
        <div className="space-y-6">
          {feature.benefits.map((benefit, benefitIndex) => (
            <div key={benefitIndex} className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700" itemProp="featureList">{benefit}</span>
            </div>
          ))}
        </div>
        
        {/* 사용 예시 */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
          <p className="text-gray-700">
            <span className="text-blue-600 font-medium">예시:</span> 
            <span itemProp="example">{feature.example}</span>
          </p>
        </div>
        
        {/* 숨겨진 키워드 - SEO용 */}
        <div className="hidden">
          {feature.keywords.map((keyword, keywordIndex) => (
            <span key={keywordIndex} itemProp="keywords">{keyword}</span>
          ))}
        </div>
      </div>

      {/* 영상 영역 */}
      <div className="flex-1" itemScope itemType="https://schema.org/VideoObject">
        <meta itemProp="name" content={`${feature.title} 데모`} />
        {/* <meta itemProp="description" content={feature.description} /> */}
        <meta itemProp="thumbnailUrl" content={feature.poster || `/images/feature-${feature.id}-thumbnail.jpg`} />
        <meta itemProp="contentUrl" content={feature.videoUrl} />
        
        <VideoPlayer 
          src={feature.videoUrl}
          poster={feature.poster || `/images/feature-${feature.id}-thumbnail.jpg`}
          className="rounded-xl shadow-lg"
          aria-label={`${feature.title} 기능 데모 영상`}
        />
      </div>
    </div>
  )
} 