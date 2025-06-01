'use client'

import { BetaSignupForm } from '@/components/forms/BetaSignupForm'

export function CTASection() {
  return (
    <section id="cta-section" className="py-20 bg-blue-600">
      <div className="max-w-4xl mx-auto px-6">
        {/* 메인 헤딩 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <span className="text-white text-sm font-medium">🎉 베타 출시 기념 특별 혜택</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            지금 신청하면
            <span className="block text-yellow-300">1달 무료 프로 버전!</span>
          </h2>
          
          <p className="text-xl text-blue-100 mb-8">
            베타 테스터만을 위한 특별한 기회를 놓치지 마세요
          </p>
        </div>

        {/* 혜택 강조 박스 */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">엑션 pro 한 달 무료</h3>
                <p className="text-blue-100 text-sm">프로 버전 모든 기능을<br />1달 간 무료로 이용하세요</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">12,900원 상당</h3>
                <p className="text-blue-100 text-sm">정식 출시 후<br />월 구독료와 동일한 혜택</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">우선 사용권</h3>
                <p className="text-blue-100 text-sm">정식 출시 전<br />가장 먼저 체험하세요</p>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 혜택 리스트 */}
        <div className="text-center mb-12">
          <div className="inline-flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center text-blue-100">
              <svg className="w-4 h-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              선결재 필요 없음
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-4 h-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              베타 피드백 반영 우선권
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-4 h-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              언제든 해지 가능
            </div>
          </div>
        </div>

        {/* 베타 신청 폼 */}
        <div className="max-w-2xl mx-auto">
          <BetaSignupForm />
        </div>

        {/* 마감 임박 메시지 */}
        <div className="text-center mt-8">
          <p className="text-blue-100 text-sm">
            ⏰ 베타 테스터 모집은 <span className="text-yellow-300 font-semibold">선착순 100명</span>으로 제한됩니다
          </p>
        </div>
      </div>
    </section>
  )
}