import { ctaData } from '@/_components/lendingComponents/lending/data/cta'

// 혜택 아이콘 매핑
const getBenefitIcon = (id: number) => {
  switch (id) {
    case 1:
      return (
        <svg className="w-4 h-4 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    case 2:
      return (
        <svg className="w-4 h-4 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 3:
      return (
        <svg className="w-4 h-4 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    default:
      return null
  }
}

// SSG로 렌더링되는 CTA 혜택 섹션
export function CTABenefits() {
  return (
    <>
      {/* 주요 혜택 강조 박스 */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-8">
          <div 
            className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6 text-center"
            itemScope 
            itemType="https://schema.org/ItemList"
          >
            <meta itemProp="name" content="베타 테스터 혜택" />
            <meta itemProp="numberOfItems" content={ctaData.mainBenefits.length.toString()} />
            
            {ctaData.mainBenefits.map((benefit, index) => (
              <div 
                key={benefit.id} 
                className="space-y-1 md:space-y-2"
                itemProp="itemListElement"
                itemScope 
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={(index + 1).toString()} />
                
                <div 
                  itemProp="item" 
                  itemScope 
                  itemType="https://schema.org/Offer"
                >
                  <meta itemProp="name" content={benefit.title} />
                  <meta itemProp="description" content={benefit.description.replace('\n', ' ')} />
                  <meta itemProp="price" content="0" />
                  <meta itemProp="priceCurrency" content="KRW" />
                  
                  {/* 아이콘 */}
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-3">
                    {getBenefitIcon(benefit.id)}
                  </div>
                  
                  {/* 제목 */}
                  <h3 className="text-sm md:text-lg font-semibold text-white" itemProp="name">
                    {benefit.title}
                  </h3>
                  
                  {/* 설명 */}
                  <p className="text-blue-100 text-xs md:text-sm" itemProp="description">
                    {benefit.description}
                  </p>
                  
                  {/* 숨겨진 키워드 - SEO용 */}
                  <div className="hidden">
                    {benefit.keywords.map((keyword, keywordIndex) => (
                      <span key={keywordIndex} itemProp="keywords">{keyword}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 추가 혜택 리스트 */}
      <div className="text-center mb-12">
        <div className="inline-flex flex-wrap justify-center gap-4 text-sm md:text-base">
          {ctaData.additionalBenefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex items-center text-blue-100"
              itemScope 
              itemType="https://schema.org/Thing"
            >
              <meta itemProp="name" content={benefit.text} />
              <meta itemProp="description" content={benefit.description} />
              
              <svg className="w-4 h-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span itemProp="name">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
} 