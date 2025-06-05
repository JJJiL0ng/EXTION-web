import { ReviewContent } from './reviewPart'

// SSR 컴포넌트 - 서버에서 렌더링되는 정적 콘텐츠
export function ReviewSection() {
  return (
    <section className="py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 리뷰 콘텐츠 영역 */}
        <div className="max-w-7xl mx-auto">
          <ReviewContent />
        </div>
        
      </div>
    </section>
  )
}
