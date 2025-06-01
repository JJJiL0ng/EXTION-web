import { HeroButtons } from './HeroButtons'

// 서버에서 렌더링되는 정적 콘텐츠
export function HeroContent() {
  return (
    <>
      {/* 메인 헤드라인 - SEO 최적화 */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
        엑셀 몰라도 괜찮아요. <br />
        <span className="text-blue-600">초보도 프로처럼.</span>
      </h1>
      
      {/* 서브 헤드라인 - 검색 엔진을 위한 키워드 포함 */}
      <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
        Extion은 당신의 말을 알아듣는 엑셀 비서입니다.<br />
        <strong>&quot;하고 싶은 걸 말하면 되는&quot;</strong> 엑셀 도구
      </p>

      {/* 핵심 가치 제안 - 구조화된 데이터 */}
      <div className="hidden">
        {/* SEO를 위한 숨겨진 구조화된 텍스트 */}
        <span itemProp="description">
          엑셀 자동화, 자연어 처리, AI 엑셀 도구, 표 정리, 데이터 분석, 차트 생성
        </span>
      </div>

      {/* CTA 버튼들 - 인터랙티브 요소는 별도 컴포넌트 */}
      <HeroButtons />
    </>
  )
}