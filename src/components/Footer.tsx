import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 브랜드 섹션 */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/logo-lg.png"
                alt="엑션 로고"
                width={160}
                height={50}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-600 mb-4 max-w-md">
              자연어로 엑셀 작업을 자동화하는 AI 도구입니다. 
              복잡한 함수를 몰라도 말 한마디로 데이터를 분석하고 차트를 생성할 수 있습니다.
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>Developed by</span>
              <span className="ml-2 font-semibold text-blue-600">Palacers</span>
            </div>
          </div>

          {/* 제품 링크 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              제품
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  주요 기능
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  요금제
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  API
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  연동
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 및 법률 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              지원 및 정책
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  고객 지원
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  문서
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 영역 */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <p className="text-sm text-gray-500">
                © {currentYear} Extion by Palacers. All rights reserved.
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500">서비스 정상 운영중</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="mailto:jihong9412@gmail.com" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="이메일 문의"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </Link>
              <Link 
                href="https://www.instagram.com/extion_official/" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="인스타그램 팔로우"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 