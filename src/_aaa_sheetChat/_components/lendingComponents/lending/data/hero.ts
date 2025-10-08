// 히어로 섹션 정적 데이터 - SSG 최적화
export const heroData = {
  // SEO 최적화된 메인 헤드라인
  headline: {
    main: "Just Tell Extion",
    highlight: "what you want in your sheet",
    subtitle: "The AI assistant that makes spreadsheets effortless.",
    description: "Next-generation spreadsheet AI Agent"
  },
  
  // 구조화된 데이터용 키워드
  seoKeywords: [
    "Excel automation",
    "Natural language processing",
    "AI Excel tools", 
    "Table organization",
    "Data analysis",
    "Chart generation",
    "Excel functions",
    "Spreadsheet AI"
],
  
  // 비디오 메타데이터
  video: {
    src: "https://video.extion.co/main-demo.MP4",
    poster: "https://video.extion.co/main-demo-thum.png",
    title: "Extion Demo - Perform Excel Tasks with Natural Language",
    description: "\"Sort this\", \"Create a chart\", \"Remove duplicates\" ",
    duration: 30,
    width: 1920,
    height: 1080
  },
  
  // 핵심 가치 제안 (구조화된 데이터용)
  valuePropositions: [
   {
     title: "Natural Language Commands",
     description: "Complete Excel tasks with simple voice commands - no complex formulas needed"
   },
   {
     title: "Smart Data Cleanup",
     description: "Automatically organize messy spreadsheets into clean, structured data"
   },
   {
     title: "Instant Visualization",
     description: "Transform your data into professional charts and graphs in seconds"
   }
],
  
  // 사용 예시 (SEO용)
 examples: [
   "Clean up sales data → Auto merge + sort + filter applied instantly",
   "Organize expense records → Duplicate removal + table formatting in one click", 
   "Show this month's spending as chart → Bar graph generated automatically"
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