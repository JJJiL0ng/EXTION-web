'use client'

import { Button } from '@/components/ui/Button'
import { scrollToElement } from '@/lending-libs/lending-utils'
import { useRouter } from 'next/navigation'

// 클라이언트에서만 실행되는 인터랙티브 버튼들
export function HeroButtons() {
  const router = useRouter()

  const handleCTAClick = () => {
    router.push('/ai')
    
    // 이벤트 트래킹
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: 'hero_beta_signup',
        value: 1
      })
    }
  }

  const handleDemoClick = () => {
    scrollToElement('demo-video', 80)
    
    // 이벤트 트래킹
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_click', {
        event_category: 'engagement', 
        event_label: 'hero_demo_video',
        value: 1
      })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 lg:mb-12">
      <Button 
        size="lg" 
        className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg lg:text-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto min-w-[240px] rounded-full"
        onClick={handleCTAClick}
      >
        <span className="flex items-center gap-2">
          무료로 시작하기
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </Button>
      
      <Button 
        variant="outline" 
        size="lg" 
        className="px-8 py-4 text-lg lg:text-xl border-2 hover:bg-blue-50 transition-all duration-200 w-full sm:w-auto min-w-[200px] rounded-full"
        onClick={handleDemoClick}
      >
        <span className="flex items-center gap-2">
          데모 영상 보기
        </span>
      </Button>
    </div>
  )
}