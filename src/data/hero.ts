// 히어로 섹션 정적 데이터 - SSG 최적화
export const heroData = {
  // SEO 최적화된 메인 헤드라인
  headline: {
    main: "엑셀 몰라도 괜찮아요.",
    highlight: "초보도 프로처럼.",
    subtitle: "Extion은 당신의 말을 알아듣는 엑셀 비서입니다.",
    description: "\"하고 싶은 걸 말하면 되는\" 엑셀 도구"
  },
  
  // 구조화된 데이터용 키워드
  seoKeywords: [
    "엑셀 자동화",
    "자연어 처리", 
    "AI 엑셀 도구",
    "표 정리",
    "데이터 분석",
    "차트 생성",
    "엑셀 함수",
    "스프레드시트 AI"
  ],
  
  // 비디오 메타데이터
  video: {
    src: "https://video.extion.co/main-demo.MP4",
    poster: "https://video.extion.co/main-demo-thum.png",
    title: "Extion 데모 - 자연어로 엑셀 작업하기",
    description: "\"정렬해줘\", \"차트 만들어줘\", \"중복 제거해줘\" 같은 자연어 명령만으로 복잡한 엑셀 작업이 자동으로 처리됩니다",
    duration: 30,
    width: 1920,
    height: 1080
  },
  
  // 핵심 가치 제안 (구조화된 데이터용)
  valuePropositions: [
    {
      title: "자연어 명령 처리",
      description: "복잡한 함수 없이 말로만 엑셀 작업 완료"
    },
    {
      title: "자동 표 정리",
      description: "지저분한 데이터를 깔끔하게 자동 정리"
    },
    {
      title: "즉시 시각화",
      description: "데이터를 차트로 바로 변환"
    }
  ],
  
  // 사용 예시 (SEO용)
  examples: [
    "매출표 정리해줘 → 병합 + 정렬 + 필터까지 자동 처리",
    "지출내역 정리해줘 → 중복 제거, 표 스타일 정리까지 한 번에",
    "이번 달 지출 차트로 보여줘 → 막대그래프 자동 생성"
  ]
} as const

// JSON-LD 구조화된 데이터 생성
export function generateHeroStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Extion",
    "description": heroData.headline.subtitle + " " + heroData.headline.description,
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": ["Windows", "macOS", "Web"],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW",
      "description": "베타 무료 체험",
      "availability": "https://schema.org/InStock"
    },
    "featureList": heroData.valuePropositions.map(vp => vp.description),
    "screenshot": heroData.video.poster,
    "video": {
      "@type": "VideoObject",
      "name": heroData.video.title,
      "description": heroData.video.description,
      "thumbnailUrl": heroData.video.poster,
      "contentUrl": heroData.video.src,
      "duration": `PT${heroData.video.duration}S`,
      "width": heroData.video.width,
      "height": heroData.video.height
    }
  }
} 