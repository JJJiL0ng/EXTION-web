"use client";

import React, { useEffect, useState } from "react";

type Variant = "wave" | "bounce" | "fade";

interface TypingIndicatorProps {
  className?: string;
  color?: string;                // 점 색상
  dotCount?: number;             // 점 개수
  sizePx?: number;               // 점 크기(px)
  variant?: Variant;             // 애니메이션 패턴
  message?: string;              // 보조텍스트
  showHelperAfterMs?: number;    // 보조텍스트 노출 지연(ms)
  showHelper?: boolean;          // 보조텍스트 사용 여부
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  className = "",
  color = "#005ed9",
  dotCount = 3,
  sizePx = 12,
  variant = "wave",
  message = "시트 데이터 분석 중…",
  showHelperAfterMs = 1800,
  showHelper = true,
}) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!showHelper) return;
    const t = setTimeout(() => setShowText(true), showHelperAfterMs);
    return () => clearTimeout(t);
  }, [showHelper, showHelperAfterMs]);

  const dots = Array.from({ length: dotCount });

  // 디버깅 로그
  console.log('💭 [TypingIndicator] Rendering');

  return (
    <div
      className={`relative pb-7 ${className}`}
      role="status"
      aria-live="polite"
      aria-label="AI가 답변을 생성 중입니다"
    >
      {/* 타이핑 인디케이터와 보조 텍스트 */}
      <div className="flex px-2 items-center gap-3">
        {/* 점 3개 인디케이터 */}
        <div className="flex space-x-3">
          {dots.map((_, i) => (
            <div
              key={i}
              className="rounded-full ti-dot"
              style={
                {
                  width: sizePx,
                  height: sizePx,
                  backgroundColor: color,
                  ["--d" as any]: `${i * 120}ms`, // 각 점 딜레이 (스태거)
                } as React.CSSProperties
              }
              data-variant={variant}
            />
          ))}
        </div>

        {/* 보조 텍스트: wave 애니메이션 오른쪽에 배치 */}
        {/* {showHelper && (
          <span
            className="text-sm text-gray-500 ti-helper select-none whitespace-nowrap"
            style={{ opacity: showText ? 1 : 0, pointerEvents: "none" }}
          >
            {message}
          </span>
        )} */}
      </div>


      <style jsx>{`
        /* 접근성: 모션 감소 선호 시 정적 표시 */
        @media (prefers-reduced-motion: reduce) {
          .ti-dot {
            animation: none !important;
            opacity: 0.7;
          }
          .ti-helper {
            animation: none !important;
          }
        }

        .ti-dot {
          opacity: 0.6;
          will-change: transform, opacity;
        }

        /* wave: 부드러운 높낮이 + 불투명도 (약 ~1s 루프) */
        .ti-dot[data-variant='wave'] {
          animation: ti-wave 1.05s ease-in-out infinite;
          animation-delay: var(--d);
        }
        @keyframes ti-wave {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          40%      { transform: translateY(-6px); opacity: 1; }
          60%      { transform: translateY(-3px); opacity: 0.8; }
        }

        /* bounce: 살짝 탄성, 과한 스케일은 지양 */
        .ti-dot[data-variant='bounce'] {
          animation: ti-bounce 1.0s ease-in-out infinite;
          animation-delay: var(--d);
        }
        @keyframes ti-bounce {
          0%, 80%, 100% { transform: translateY(0) scale(0.9); opacity: 0.55; }
          40%           { transform: translateY(-8px) scale(1.05); opacity: 1; }
        }

        /* fade: 차분한 등장/퇴장 */
        .ti-dot[data-variant='fade'] {
          animation: ti-fade 1.1s ease-in-out infinite;
          animation-delay: var(--d);
        }
        @keyframes ti-fade {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50%      { opacity: 1;   transform: translateY(-2px); }
        }

        /* 보조 텍스트: 미세한 페이드 인 */
        .ti-helper {
          animation: ti-helper-fade 0.2s ease-out 1;
        }
        @keyframes ti-helper-fade {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
