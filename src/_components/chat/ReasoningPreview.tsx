"use client";

import React, { useEffect, useState } from "react";

interface ReasoningPreviewProps {
  reasoning: string;
  isComplete: boolean;
  className?: string;
  typingSpeed?: number; // 문자당 밀리초 (기본: 30ms)
}

const ReasoningPreview: React.FC<ReasoningPreviewProps> = ({
  reasoning,
  isComplete,
  className = "",
  typingSpeed = 30,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // reasoning이 변경될 때마다 타이핑 효과 시작
  useEffect(() => {
    console.log('🧠 [ReasoningPreview] Props changed:', {
      reasoningLength: reasoning.length,
      reasoning: reasoning.substring(0, 100) + (reasoning.length > 100 ? '...' : ''),
      isComplete,
      displayedTextLength: displayedText.length,
      currentIndex
    });

    if (!reasoning) {
      console.log('🧠 [ReasoningPreview] No reasoning text, clearing display');
      setDisplayedText("");
      setCurrentIndex(0);
      return;
    }

    // 새로운 텍스트가 더 짧으면 바로 업데이트
    if (reasoning.length < displayedText.length) {
      console.log('🧠 [ReasoningPreview] Shorter text received, updating immediately');
      setDisplayedText(reasoning);
      setCurrentIndex(reasoning.length);
      return;
    }

    // 이미 완료된 경우 바로 표시
    if (isComplete && displayedText !== reasoning) {
      console.log('🧠 [ReasoningPreview] Complete reasoning received, displaying immediately');
      setDisplayedText(reasoning);
      setCurrentIndex(reasoning.length);
      return;
    }

    console.log('🧠 [ReasoningPreview] Starting typing effect:', {
      startIndex: currentIndex,
      targetLength: reasoning.length,
      typingSpeed
    });

    // 타이핑 효과를 위한 인터벌
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= reasoning.length) {
          console.log('🧠 [ReasoningPreview] Typing effect completed');
          clearInterval(interval);
          return prevIndex;
        }

        const nextIndex = prevIndex + 1;
        setDisplayedText(reasoning.substring(0, nextIndex));
        
        if (nextIndex % 20 === 0) { // 20글자마다 로그 출력
          console.log('🧠 [ReasoningPreview] Typing progress:', {
            progress: `${nextIndex}/${reasoning.length}`,
            percentage: Math.round((nextIndex / reasoning.length) * 100) + '%'
          });
        }
        
        return nextIndex;
      });
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [reasoning, isComplete, typingSpeed]);

  // reasoning이 비어있으면 렌더링하지 않음
  if (!reasoning) return null;

  return (
    <div
      className={`px-1 py-1 ${className}`}
      role="status"
      aria-live="polite"
      aria-label="AI 추론 과정"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="bg-blue-500 rounded-full reasoning-pulse"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
            <span></span>
            AI 추론 중...
          </div>
          <div className="text-sm text-gray-800 leading-tight whitespace-pre-wrap font-mono">
            <span className="reasoning-text">{displayedText}</span>
            {!isComplete && currentIndex < reasoning.length && (
              <span className="reasoning-cursor">|</span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* 접근성: 모션 감소 선호 시 애니메이션 비활성화 */
        @media (prefers-reduced-motion: reduce) {
          .reasoning-pulse,
          .reasoning-cursor {
            animation: none !important;
          }
          .reasoning-pulse {
            opacity: 0.7;
          }
          .reasoning-cursor {
            opacity: 1;
          }
        }

        .reasoning-pulse {
          animation: reasoning-pulse 1.5s ease-in-out infinite;
        }

        @keyframes reasoning-pulse {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(0.9);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.1);
          }
        }

        .reasoning-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background-color: #3b82f6;
          margin-left: 1px;
          animation: reasoning-blink 1s ease-in-out infinite;
          vertical-align: text-top;
        }

        @keyframes reasoning-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .reasoning-text {
          color: #374151;
          line-height: 1.3;
        }

        /* 글자별 페이드인 효과 */
        .reasoning-text {
          animation: reasoning-fadein 0.3s ease-out;
        }

        @keyframes reasoning-fadein {
          from { 
            opacity: 0; 
            transform: translateY(2px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ReasoningPreview;