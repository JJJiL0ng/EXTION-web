// Feature 섹션 정적 데이터 - SSG 최적화
export interface Feature {
  id: number
  title: string
  subtitle: string
  description: string
  example: string
  videoUrl: string
  poster?: string
  icon: string
  benefits: string[]
  keywords: string[]
}

export const featuresData = {
  // 섹션 헤더 정보
  header: {
    title: "핵심 기능",
    subtitle: "자연어로 엑셀 작업이 이렇게 쉬워집니다",
    description: "복잡한 함수나 매크로 없이, 말 한마디로 모든 엑셀 작업을 자동화하세요"
  },
  
  // 기능 목록
  features: [
    {
      id: 1,
      title: "자연어 명령 처리",
      subtitle: "말 한마디로 엑셀 자동 실행!",
      description: "정렬해줘, 차트로 보여줘처럼 대화하듯 입력만 하면, 복잡한 엑셀 작업이 자동으로 처리됩니다.",
      example: "매출표 정리해줘 → 병합 + 정렬 + 필터까지 자동 처리 완료!",
      videoUrl: "https://video.extion.co/hero-sample.mp4",
      poster: "https://video.extion.co/feature-1-thumbnail.jpg",
      icon: "💬",
      benefits: [
        "복잡한 함수 학습 불필요",
        "직관적인 자연어 명령",
        "즉시 실행되는 자동화"
      ],
      keywords: ["자연어 처리", "음성 명령", "AI 엑셀", "자동화"]
    },
    {
      id: 2,
      title: "표 자동 정리",
      subtitle: "지저분한 데이터? 한 번에 깔끔하게!",
      description: "병합 셀, 중복값, 비어있는 셀 등을 자동으로 정리해서 읽기 쉬운 표로 재구성합니다.",
      example: "지출내역 정리해줘 → 비어 있는 셀, 중복 제거, 표 스타일 정리까지 한 번에!",
      videoUrl: "https://pub-4a3591bf83af49968ea0c99fbe105456.r2.dev/hero-sample.mp4",
      poster: "https://video.extion.co/feature-2-thumbnail.jpg",
      icon: "📊",
      benefits: [
        "자동 데이터 정제",
        "일관된 표 형식",
        "중복 데이터 제거"
      ],
      keywords: ["데이터 정리", "표 정제", "중복 제거", "데이터 클리닝"]
    },
    {
      id: 3,
      title: "시각화 기능",
      subtitle: "그래프? 그냥 말하면 그려줍니다.",
      description: "데이터를 분석해 가장 어울리는 차트를 자동 추천 + 생성합니다.",
      example: "이번 달 지출 차트로 보여줘 → 막대그래프 자동 생성, 컬러와 레이블까지 깔끔하게!",
      videoUrl: "/videos/feature-3.mp4",
      poster: "https://video.extion.co/feature-3-thumbnail.jpg",
      icon: "📈",
      benefits: [
        "자동 차트 추천",
        "맞춤형 시각화",
        "전문적인 디자인"
      ],
      keywords: ["차트 생성", "데이터 시각화", "그래프", "분석"]
    }
  ] as Feature[]
} as const

// 각 기능에 맞는 아이콘 매핑 함수
export const getFeatureIcon = (id: number): string => {
  const feature = featuresData.features.find(f => f.id === id)
  return feature?.icon || '✨'
}

// Feature 섹션 구조화된 데이터 생성
export function generateFeaturesStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": featuresData.header.title,
    "description": featuresData.header.description,
    "numberOfItems": featuresData.features.length,
    "itemListElement": featuresData.features.map((feature, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareFeature",
        "name": feature.title,
        "description": feature.description,
        "featureList": feature.benefits,
        "keywords": feature.keywords.join(', '),
        "example": feature.example,
        "video": {
          "@type": "VideoObject",
          "name": `${feature.title} 데모`,
          "description": feature.description,
          "thumbnailUrl": feature.poster,
          "contentUrl": feature.videoUrl
        }
      }
    }))
  }
}

// SEO용 키워드 추출
export function getAllFeatureKeywords(): string[] {
  return featuresData.features.flatMap(feature => feature.keywords)
} 