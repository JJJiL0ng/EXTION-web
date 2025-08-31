import Image from 'next/image'
import { heroData } from '@/_components/lendingComponents/lending/data/hero'

// SSG로 렌더링되는 비디오 정적 콘텐츠
export function HeroVideoStatic() {
  return (
    <div className="w-full">
      {/* 서버에서 렌더링되는 썸네일 이미지 - SEO 최적화 */}
      <div 
        id="demo-video" 
        className="relative rounded-3xl overflow-hidden shadow-2xl w-full mx-auto"
        style={{ aspectRatio: '16/9', maxHeight: '70vh' }}
        itemScope 
        itemType="https://schema.org/VideoObject"
      >
        {/* 구조화된 데이터 - 비디오 메타데이터 */}
        <meta itemProp="name" content={heroData.video.title} />
        <meta itemProp="description" content={heroData.video.description} />
        <meta itemProp="thumbnailUrl" content={heroData.video.poster} />
        <meta itemProp="contentUrl" content={heroData.video.src} />
        <meta itemProp="duration" content={`PT${heroData.video.duration}S`} />
        <meta itemProp="width" content={heroData.video.width.toString()} />
        <meta itemProp="height" content={heroData.video.height.toString()} />
        
        <Image
          src={heroData.video.poster}
          alt={heroData.video.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
        />
        
        {/* 재생 버튼 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all duration-200">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              aria-label="동영상 재생"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* 영상 하단 설명 텍스트 - SSG로 렌더링 */}
      <div className="text-center mt-6 lg:mt-8 max-w-3xl mx-auto">
        <p className="text-gray-600 text-lg lg:text-xl leading-relaxed">
          {heroData.video.description.split('같은 ')[0]}같은 <strong className="text-blue-600">자연어 명령</strong>만으로<br />
          복잡한 엑셀 작업이 <strong className="text-blue-600">자동으로 처리</strong>됩니다
        </p>
        
        {/* 사용 예시들 - SEO 최적화 */}
        <div className="mt-6 space-y-2">
          {heroData.examples.map((example, index) => (
            <div key={index} className="text-sm text-gray-500 hidden">
              {/* SEO용 숨겨진 예시들 */}
              <span itemProp="example">{example}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 