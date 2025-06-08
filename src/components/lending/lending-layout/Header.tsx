'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { scrollToElement } from '@/lending-libs/lending-utils'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()

  const handleBetaClick = () => {
    router.push('/ai')
    
    // 이벤트 트래킹
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: 'header_beta_signup',
        value: 1
      })
    }
  }

  return (
    <header className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/" 
            className="flex items-center"
            aria-label="엑션 홈페이지로 이동"
          >
            {/* Mobile Logo */}
            <Image
              src="/logo.png"
              alt="엑션 로고"
              width={120}
              height={40}
              className="h-8 w-auto sm:hidden"
              priority
            />
            {/* Desktop Logo */}
            <Image
              src="/logo-lg.png"
              alt="엑션 로고"
              width={160}
              height={50}
              className="hidden sm:block h-10 w-auto"
              priority
            />
          </Link>
          
          {/* 베타 신청 버튼 */}
          <Button 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg rounded-full"
            onClick={handleBetaClick}
          >
            <span className="flex items-center gap-2">
              무료로 시작하기
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
} 