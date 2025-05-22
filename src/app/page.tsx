import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              Ex<span className="text-[#005DE9]">tion</span>
            </h1>
            <div className="w-24 h-1 bg-[#005DE9] mx-auto rounded-full"></div>
          </div>

          {/* Main Message */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              함수 몰라도 돼.<br />
              <span className="text-[#005DE9]">그냥 말만 해.</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              엑셀을 잘 몰라도 자연어로 표를 정리하고 수정할 수 있는 AI 도구
            </p>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 max-w-2xl mx-auto">
              <div className="text-left space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#005DE9] rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">"이 열에서 합계 구해줘"</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#005DE9] rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">"정렬하고 중복 제거해줘"</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#005DE9] rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">"100 이상인 값만 새 시트로 뽑아줘"</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            <Link 
              href="/login"
              className="inline-flex items-center px-12 py-4 bg-[#005DE9] text-white text-xl font-semibold rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              바로 시작하기
              <svg 
                className="ml-3 w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" 
                />
              </svg>
            </Link>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#005DE9] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#005DE9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">자연어로 요청</h3>
              <p className="text-gray-600">복잡한 함수 대신 말로 설명하면 바로 실행</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#005DE9] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#005DE9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">안전한 실행</h3>
              <p className="text-gray-600">원본 보존과 미리보기로 실수 걱정 없이</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#005DE9] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#005DE9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">즉시 자동화</h3>
              <p className="text-gray-600">반복 작업을 한번 설정으로 자동 처리</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#005DE9] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#005DE9] to-indigo-400 opacity-3 rounded-full blur-3xl"></div>
      </div>
    </main>
  )
}