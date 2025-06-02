'use client'

import { CTAHeader } from './CTAHeader'
import { CTABenefits } from './CTABenefits'
import { BetaSignupForm } from '@/components/forms/BetaSignupForm'
import { ctaData } from '@/data/cta'

export function CTASection() {
  return (
    <section id="cta-section" className="py-20 bg-blue-600" itemScope itemType="https://schema.org/Offer">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* 헤더 섹션 - SSG 렌더링 */}
        <CTAHeader />

        {/* 혜택 섹션 - SSG 렌더링 */}
        <CTABenefits />

        {/* 베타 신청 폼 */}
        <div className="max-w-2xl mx-auto">
          <BetaSignupForm />
        </div>

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
            <meta itemProp="url" content="https://extion.app" />
            <meta itemProp="description" content="AI 기반 엑셀 자동화 도구" />
          </div>
          
          {/* 베타 프로그램 정보 */}
          <div itemScope itemType="https://schema.org/Event">
            <meta itemProp="name" content="Extion 베타 테스터 모집" />
            <meta itemProp="description" content={ctaData.header.subtitle} />
            <meta itemProp="startDate" content="2024-01-01" />
            <meta itemProp="endDate" content="2024-12-31" />
            <meta itemProp="eventStatus" content="https://schema.org/EventScheduled" />
            <meta itemProp="eventAttendanceMode" content="https://schema.org/OnlineEventAttendanceMode" />
          </div>
        </div>
      </div>
    </section>
  )
}