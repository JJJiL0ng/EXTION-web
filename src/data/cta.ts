// CTA 섹션 정적 데이터 - SSG 최적화
export const ctaData = {
  // 메인 헤딩 정보
  header: {
    badge: "🎉 베타 출시 기념 특별 혜택",
    title: "지금 신청하면",
    highlight: "1달 무료 프로 버전!",
    subtitle: "베타 테스터만을 위한 특별한 기회를 놓치지 마세요"
  },
  
  // 주요 혜택 정보
  mainBenefits: [
    {
      id: 1,
      icon: "💰",
      title: "엑션 pro 한 달 무료",
      description: "프로 버전 모든 기능을\n1달 간 무료로 이용하세요",
      value: "12,900원 상당",
      keywords: ["무료 체험", "프로 버전", "베타 혜택"]
    },
    {
      id: 2,
      icon: "✅",
      title: "12,900원 상당",
      description: "정식 출시 후\n월 구독료와 동일한 혜택",
      value: "정가 대비 100% 할인",
      keywords: ["할인", "구독료", "혜택"]
    },
    {
      id: 3,
      icon: "⚡",
      title: "우선 사용권",
      description: "정식 출시 전\n가장 먼저 체험하세요",
      value: "선착순 100명 한정",
      keywords: ["우선 사용", "베타 테스터", "선착순"]
    }
  ],
  
  // 추가 혜택 목록
  additionalBenefits: [
    {
      text: "선결재 필요 없음",
      description: "신용카드나 결제 정보 없이 바로 체험"
    },
    {
      text: "베타 피드백 반영 우선권",
      description: "사용자 의견을 제품 개발에 우선 반영"
    },
    {
      text: "언제든 해지 가능",
      description: "부담 없이 체험 후 자유롭게 해지"
    }
  ],
  
  // 폼 관련 정보
  form: {
    title: "베타 체험 신청",
    subtitle: "출시 알림을 받고 무료 체험하세요",
    submitText: "베타 체험 신청하기",
    loadingText: "신청 중...",
    placeholder: "010 1234 5678",
    notice: "신청 후 영업일 기준 1-2일 내에 연락드립니다"
  },
  
  // 성공 메시지
  success: {
    title: "신청이 완료되었습니다!",
    subtitle: "베타 출시 소식을 가장 먼저 알려드릴게요.\n곧 연락드리겠습니다.",
    benefits: [
      "✅ 프로 이용권 1달 무료",
      "✅ 베타 피드백 우선 반영", 
      "✅ 언제든 해지 가능"
    ]
  },
  
  // 마감 임박 메시지
  urgency: {
    message: "⏰ 베타 테스터 모집은",
    highlight: "선착순 100명",
    suffix: "으로 제한됩니다"
  },
  
  // SEO 키워드
  seoKeywords: [
    "베타 테스트",
    "무료 체험",
    "엑셀 AI 베타",
    "프로 버전 무료",
    "베타 신청",
    "선착순 모집"
  ]
} as const

// CTA 섹션 구조화된 데이터 생성
export function generateCTAStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": `${ctaData.header.title} ${ctaData.header.highlight}`,
    "description": ctaData.header.subtitle,
    "price": "0",
    "priceCurrency": "KRW",
    "availability": "https://schema.org/InStock",
    "validThrough": "2025-12-31",
    "category": "SoftwareApplication",
    "itemOffered": {
      "@type": "SoftwareApplication",
      "name": "Extion Pro",
      "applicationCategory": "ProductivityApplication",
      "description": "엑셀 자동화 AI 도구 프로 버전",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "KRW",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      }
    },
    "seller": {
      "@type": "Organization",
      "name": "Extion",
      "url": "https://extion.app"
    }
  }
}

// 혜택 정보 구조화된 데이터
export function generateBenefitsStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "베타 테스터 혜택",
    "description": "Extion 베타 테스터를 위한 특별 혜택",
    "numberOfItems": ctaData.mainBenefits.length,
    "itemListElement": ctaData.mainBenefits.map((benefit, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Offer",
        "name": benefit.title,
        "description": benefit.description.replace('\n', ' '),
        "price": "0",
        "priceCurrency": "KRW"
      }
    }))
  }
} 