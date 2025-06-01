'use client'

import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { useState, useEffect } from 'react'

// 클라이언트에서만 로드되는 영상 컴포넌트
export function HeroVideo() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 컴포넌트가 마운트된 후 영상 로드
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    // 서버 렌더링 시에는 플레이스홀더 표시
    return (
      <div 
        id="demo-video" 
        className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-100 animate-pulse w-full mx-auto"
        style={{ aspectRatio: '16/9', maxHeight: '70vh' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400">
            <svg className="w-16 h-16 lg:w-24 lg:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 015.83 1M15 13a3 3 0 01-6 0m6 0a3 3 0 01-6 0m6 0v1a2 2 0 01-2 2H9a2 2 0 01-2-2v-1m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2-2v5.02" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 움짤처럼 자동재생되는 영상 플레이어 */}
      <div 
        id="demo-video" 
        style={{ maxHeight: '80vh' }}
      >
        <VideoPlayer 
          src="https://pub-4a3591bf83af49968ea0c99fbe105456.r2.dev/hero-sample.mp4"
          autoPlay={true}
          muted={true}
          loop={true}
          showControls={false}
          playsInline={true}
          className="w-full h-auto"
        />
      </div>
      
      {/* 영상 하단 설명 텍스트 */}
      <div className="text-center mt-6 lg:mt-8 max-w-3xl mx-auto">
        <p className="text-gray-600 text-lg lg:text-xl leading-relaxed">
          &quot;정렬해줘&quot;, &quot;차트 만들어줘&quot;, &quot;중복 제거해줘&quot; 같은 <strong className="text-blue-600">자연어 명령</strong>만으로<br />
          복잡한 엑셀 작업이 <strong className="text-blue-600">자동으로 처리</strong>됩니다
        </p>
      </div>
    </div>
  )
}