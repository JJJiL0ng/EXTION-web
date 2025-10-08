'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/_components/lendingComponents/lending-common-ui/Button'
import { scrollToElement } from '@/_utils/lending-utils/lending-utils'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()

  const handleBetaClick = () => {
    router.push('/dashboard')

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
    <header className="bg-[#EEF2F6]/10 border-b border-blue-100/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-12">
          <Link
            href="/"
            className="flex items-center"
            aria-label="엑션 홈페이지로 이동"
          >
            {/* Mobile Logo */}
            <Image
              src="/extion-small-blue.svg"
              alt="extion logo"
              width={120}
              height={50}
              className="h-10 w-auto sm:hidden"
              priority
            />
            {/* Desktop Logo */}
            <Image
              src="/extion-big-blue.svg"
              alt="extion logo"
              width={160}
              height={50}
              className="hidden sm:block h-9 w-auto"
              priority
            />
          </Link>

          {/* 베타 신청 버튼 */}
          <Link href="/trypage">
            <Button
              size="sm"
              className="bg-[#005de9] hover:bg-blue-700 px-3 py-1.5 text-sm transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg rounded"
            >
              <span className="flex items-center gap-2">
                Start for free
                <Image src="/extion-small-white.svg" alt="Extion logo" width={16} height={16} className="inline-block" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
} 