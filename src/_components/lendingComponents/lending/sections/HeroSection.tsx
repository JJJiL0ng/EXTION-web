import { HeroContent } from './HeroContent'
import { HeroVideo } from './HeroVideo'

// SSR 컴포넌트 - 서버에서 렌더링되는 정적 콘텐츠
export function HeroSection() {
  return (
    // <section className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
    <section className="min-h-screen bg-[#EEF2F6]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">

        {/* 위: 텍스트 콘텐츠 영역 */}
        <div className="max-w-5xl mx-auto text-center mb-12 lg:mb-16">
          <HeroContent />
        </div>

        {/* 아래: 영상 영역 - PC에서 매우 크게, 모바일에서도 충분히 크게 */}
        <div className="max-w-7xl mx-auto">
          <HeroVideo />
        </div>

      </div>
    </section>
  )
}