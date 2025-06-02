import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start items-center h-16">
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
        </div>
      </div>
    </header>
  )
} 