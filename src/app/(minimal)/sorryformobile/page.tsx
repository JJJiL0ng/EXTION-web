import Link from 'next/link';

export default function SorryForMobilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center">
      <div className="container mx-auto px-6 py-20 text-center max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Logo/Brand - Extion 로고를 여기에 추가할 수 있습니다. */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              Ex<span className="text-[#005DE9]">tion</span>
            </h1>
            <div className="w-20 h-1 bg-[#005DE9] mx-auto rounded-full mb-10"></div>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            모바일 환경 지원 안내
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            현재 모바일 환경에서는 서비스 이용이 어렵습니다.
            <br />
            PC 환경에서 접속해주시기 바랍니다.
          </p>
          <p className="text-md text-gray-500 mb-10">
            이용에 불편을 드려 죄송합니다.
          </p>

          {/* 개발자와 소통하기 버튼 */}
          <Link
            href="https://www.instagram.com/jjjil0ng/profilecard/?igsh=cWV6bnZ1b2QwcWJ2" // 여기에 인스타그램 프로필 URL을 넣어주세요 (예: "https://instagram.com/YOUR_ID")
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-3 bg-slate-700 text-white text-lg font-semibold rounded-lg hover:bg-slate-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            액션팀과 소통하기
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Background Elements from lending page */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#005DE9] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#005DE9] to-indigo-400 opacity-3 rounded-full blur-3xl"></div>
      </div>
    </main>
  );
}
