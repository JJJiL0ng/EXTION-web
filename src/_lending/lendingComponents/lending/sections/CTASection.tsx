'use client'

import { CTAHeader } from './CTAHeader'
import { CTABenefits } from './CTABenefits'
import { ctaData } from '@/_lending/lendingComponents/lending/data/cta'

export function CTASection() {
  return (
    <section id="cta-section" className="py-20 bg-blue-600" itemScope itemType="https://schema.org/Offer">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* 헤더 섹션 - SSG 렌더링 */}
        <CTAHeader />

        {/* 런칭 발표 섹션 */}
        {/* <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center py-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-white text-xl font-bold mb-2">
                {ctaData.launch.announcement.title}
              </h3>
              <p className="text-blue-100 text-lg mb-4">
                {ctaData.launch.announcement.subtitle}
              </p>
              <div className="text-3xl font-black text-yellow-300">
                {ctaData.launch.announcement.highlight}
              </div>
            </div>
          </div>
        </div> */}

        {/* 혜택 섹션 - SSG 렌더링 */}
        <CTABenefits />

        {/* 마감 임박 메시지 - SSG 렌더링 */}
        <div className="text-center mt-8">
          <p className="text-blue-100 text-sm">
            {ctaData.urgency.message} <span className="text-yellow-300 font-semibold">{ctaData.urgency.highlight}</span>{ctaData.urgency.suffix}
          </p>
        </div>
        
        {/* 추가 SEO 정보 - 숨겨진 구조화된 데이터 */}
        <div className="hidden">
          <div itemScope itemType="https://schema.org/Organization">
            <meta itemProp="name" content="Extion" />
            <meta itemProp="url" content="https://extion.ai" />
            <meta itemProp="description" content="AI 기반 엑셀 자동화 도구" />
          </div>
          
          {/* 베타 프로그램 정보 */}
          <div itemScope itemType="https://schema.org/Event">
            <meta itemProp="name" content="Extion 베타 서비스 런칭" />
            <meta itemProp="description" content={`${ctaData.launch.announcement.subtitle} - ${ctaData.header.subtitle}`} />
            <meta itemProp="startDate" content={ctaData.launch.date} />
            <meta itemProp="endDate" content="2024-12-31" />
            <meta itemProp="eventStatus" content="https://schema.org/EventScheduled" />
            <meta itemProp="eventAttendanceMode" content="https://schema.org/OnlineEventAttendanceMode" />
            <div itemProp="location" itemScope itemType="https://schema.org/VirtualLocation">
              <meta itemProp="url" content="https://extion.ai" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}