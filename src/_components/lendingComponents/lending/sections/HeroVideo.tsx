'use client'

import { VideoPlayer } from '@/_components/lendingComponents/lending/VideoPlayer'
import { HeroVideoStatic } from './HeroVideoStatic'
import { useState, useEffect } from 'react'
import { heroData } from '@/_components/lendingComponents/lending/data/hero'

// 클라이언트에서만 로드되는 영상 컴포넌트 - 하이드레이션 최적화
export function HeroVideo() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    // 컴포넌트가 마운트된 후 영상 로드 (성능 최적화)
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100) // 약간의 지연으로 초기 렌더링 성능 향상

    return () => clearTimeout(timer)
  }, [])

  const handleVideoReady = () => {
    setVideoReady(true)
  }

  // 서버 렌더링 시에는 정적 썸네일 표시 (SSG)
  if (!isLoaded) {
    return <HeroVideoStatic />
  }

  return (
    <div className="w-full">
      {/* 인터랙티브 비디오 플레이어 */}
      <div
        id="demo-video"
        className="relative"
        style={{ maxHeight: '80vh' }}
      >
        {/* 썸네일 이미지 (비디오가 준비되기 전까지 표시) */}
        {!videoReady && <HeroVideoStatic />}

        {/* 실제 비디오 플레이어 - 클라이언트에서만 로드 */}
        <div className={`transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}>
          <VideoPlayer
            src={heroData.video.src}
            autoPlay={true}
            muted={true}
            loop={true}
            showControls={false}
            playsInline={true}
            className="w-full h-auto rounded-3xl shadow-2xl"
            onCanPlay={handleVideoReady}
            poster={heroData.video.poster}
          />
        </div>
      </div>

      {/* 영상 하단 설명 텍스트 - 정적 렌더링 */}
      <div className="text-center mt-6 lg:mt-8 max-w-3xl mx-auto">
        <p className="text-gray-600 text-lg lg:text-xl leading-relaxed">
          Easily solve complex spreadsheet tasks using simple chat commands
        </p>
      </div>
    </div>
  )
}