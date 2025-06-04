'use client'

import React, { useState, useRef, VideoHTMLAttributes } from 'react'
import { cn } from '@/lending-libs/lending-utils'

interface VideoPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  poster?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  showControls?: boolean
  playsInline?: boolean
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  autoPlay = true,
  muted = true,
  loop = true,
  showControls = false,
  playsInline = true,
  className,
  ...props
}: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleError = () => {
    setHasError(true)
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border-2 border-blue-500", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={showControls}
        playsInline={playsInline}
        onError={handleError}
        className="w-full h-auto"
        {...props}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 에러 상태 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="text-center text-white">
            <svg className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">비디오를 로드할 수 없습니다</p>
            <button 
              onClick={() => {
                setHasError(false)
                if (videoRef.current) {
                  videoRef.current.load()
                }
              }}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    </div>
  )
}