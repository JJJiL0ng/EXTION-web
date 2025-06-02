'use client'

import { VideoPlayer } from '@/components/ui/VideoPlayer'
import { useState, useEffect } from 'react'
import Image from 'next/image'

// 클라이언트에서만 로드되는 영상 컴포넌트
export function HeroVideo() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    // 컴포넌트가 마운트된 후 영상 로드
    setIsLoaded(true)
  }, [])

  const handleVideoReady = () => {
    setVideoReady(true)
  }

  if (!isLoaded) {
    // 서버 렌더링 시에는 썸네일 이미지 표시
    return (
      <div 
        id="demo-video" 
        className="relative rounded-3xl overflow-hidden shadow-2xl w-full mx-auto"
        style={{ aspectRatio: '16/9', maxHeight: '70vh' }}
      >
        <Image
          src="https://video.extion.co/KakaoTalk_Photo_2025-06-02-13-04-41.png"
          alt="Extion 데모 영상 썸네일"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
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
        className="relative"
        style={{ maxHeight: '80vh' }}
      >
        {/* 썸네일 이미지 (비디오가 준비되기 전까지 표시) */}
        {!videoReady && (
          <div 
            className="absolute inset-0 z-10 rounded-3xl overflow-hidden shadow-2xl"
            style={{ aspectRatio: '16/9' }}
          >
            <Image
              src="https://video.extion.co/KakaoTalk_Photo_2025-06-02-13-04-41.png"
              alt="Extion 데모 영상 썸네일"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 rounded-full p-4 animate-pulse">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* 실제 비디오 플레이어 */}
        <VideoPlayer 
          src="https://pub-4a3591bf83af49968ea0c99fbe105456.r2.dev/hero-sample.mp4"
          autoPlay={true}
          muted={true}
          loop={true}
          showControls={false}
          playsInline={true}
          className={`w-full h-auto transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          onCanPlay={handleVideoReady}
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