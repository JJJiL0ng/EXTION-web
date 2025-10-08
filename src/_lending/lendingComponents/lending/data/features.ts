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
    title: "Core Features",
    subtitle: "Excel tasks made effortless with natural language",
    description: "Automate any Excel workflow with simple voice commands - no complex formulas or macros required"
  },

  // 기능 목록
  features: [
    {
      id: 1,
      title: "Natural Language Commands",
      subtitle: "Excel automation with just your voice!",
      description: "Simply speak commands like 'sort this data' or 'create a chart' and watch complex Excel tasks complete automatically.",
      example: "Clean up sales data → Auto merge + sort + filter applied instantly!",
      videoUrl: "https://video.extion.co/command.mp4",
      poster: "https://video.extion.co/command-thum.png",
      icon: "💬",
      benefits: [
        "No complex formulas to learn",
        "Intuitive voice commands",
        "Instant task automation"
      ],
      keywords: ["natural language processing", "voice commands", "AI Excel", "automation"]
    },
    {
      id: 2,
      title: "Smart Data Cleanup",
      subtitle: "Messy spreadsheets? Clean in seconds!",
      description: "Automatically fixes merged cells, removes duplicates, and fills empty cells to create perfectly organized tables.",
      example: "Organize expense records → Empty cells filled, duplicates removed, table formatted!",
      videoUrl: "https://video.extion.co/datafix.mp4",
      poster: "https://video.extion.co/datafix-thum.png",
      icon: "📊",
      benefits: [
        "Automated data cleaning",
        "Consistent table formatting",
        "Duplicate removal"
      ],
      keywords: ["data cleanup", "table formatting", "duplicate removal", "data cleaning"]
    },
    {
      id: 3,
      title: "Instant Visualization",
      subtitle: "Need charts? Just ask and it's done.",
      description: "Analyzes your data and automatically recommends and creates the most suitable charts and graphs.",
      example: "Show monthly expenses as chart → Data analyzed, perfect graph generated automatically!",
      videoUrl: "https://video.extion.co/artifact.MP4",
      poster: "https://video.extion.co/artifact-thum.png",
      icon: "📈",
      benefits: [
        "Smart chart recommendations",
        "Custom visualizations",
        "Professional designs"
      ],
      keywords: ["chart generation", "data visualization", "graphs", "analysis"]
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