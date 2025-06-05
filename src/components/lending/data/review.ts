// 리뷰 데이터 타입 정의
export interface ReviewData {
  id: string
  name: string
  role: string
  company: string
  rating: number
  comment: string
  beforeAfter?: {
    before: string
    after: string
  }
  avatar?: string
  timeReduction?: string
}

export interface ReviewSectionData {
  title: string
  subtitle: string
  description: string
  overallRating: number
  totalReviews: number
  activeUsers: number
  averageTimeReduction: string
  reviews: ReviewData[]
  seoKeywords: string[]
}

// 리뷰 데이터
export const reviewsData: ReviewSectionData = {
  title: "이미 137명이 경험한",
  subtitle: "실제 사용자 후기",
  description: "Extion을 사용하여 업무 효율성을 높인 실제 사용자들의 솔직한 후기입니다",
  overallRating: 4.8,
  totalReviews: 137,
  activeUsers: 31,
  averageTimeReduction: "87%",
  reviews: [
    {
      id: "review-1",
      name: "김민수",
      role: "회계팀 과장",
      company: "테크스타트업",
      rating: 5,
      comment: "진짜 말 한마디로 차트가 만들어져요. 회계팀에서 매일 쓰고 있어요!",
      beforeAfter: {
        before: "매일 2시간 걸리던 매출 정리",
        after: "이제 5분으로 완료"
      },
      timeReduction: "매일 2시간 → 5분"
    },
    {
      id: "review-2", 
      name: "박지영",
      role: "마케팅 담당자",
      company: "이커머스",
      rating: 5,
      comment: "엑셀 공식 모르던 제가 이제 데이터 분석까지 하고 있어요",
      beforeAfter: {
        before: "엑셀 공식 검색하느라 30분",
        after: "'정렬해줘' 한마디로 3초 완료"
      },
      timeReduction: "분석 시간 90% 단축"
    },
    {
      id: "review-3",
      name: "이창호",
      role: "스타트업 대표",
      company: "AI 스타트업",
      rating: 5,
      comment: "3시간 걸리던 보고서 정리가 5분으로 단축됐습니다",
      beforeAfter: {
        before: "주간 보고서 정리 3시간",
        after: "자동 분석으로 5분 완성"
      },
      timeReduction: "보고서 작성 95% 단축"
    },
    {
      id: "review-4",
      name: "최수연",
      role: "데이터 분석가",
      company: "대기업",
      rating: 4,
      comment: "복잡한 데이터 처리가 이렇게 간단할 줄 몰랐어요. 신입 직원도 바로 사용할 수 있어요",
      timeReduction: "데이터 처리 80% 단축"
    },
    {
      id: "review-5",
      name: "정태민",
      role: "기획팀 팀장",
      company: "제조업",
      rating: 5,
      comment: "더 이상 엑셀과 싸우지 않아도 돼요. 자연어로 말하면 원하는 결과가 나와요",
      timeReduction: "기획 문서 작성 70% 단축"
    },
    {
      id: "review-6",
      name: "강혜진",
      role: "재무팀 대리",
      company: "스타트업",
      rating: 5,
      comment: "월말 정산이 이렇게 쉬워도 되나요? 야근이 없어졌어요!",
      timeReduction: "정산 업무 85% 단축"
    }
  ],
  seoKeywords: [
    "엑셀 자동화 후기",
    "데이터 분석 도구 리뷰", 
    "업무 효율화 솔루션",
    "자연어 처리 엑셀",
    "사용자 후기",
    "생산성 향상 도구",
    "Extion 리뷰",
    "엑셀 대안",
    "데이터 시각화 도구"
  ]
}

// SEO용 구조화된 데이터 생성
export function generateReviewsStructuredData() {
  const reviews = reviewsData.reviews.map(review => ({
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.name,
      "jobTitle": review.role
    },
    "reviewRating": {
      "@type": "Rating", 
      "ratingValue": review.rating,
      "bestRating": 5
    },
    "reviewBody": review.comment,
    "datePublished": "2024-01-01"
  }))

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Extion - AI 엑셀 자동화 도구",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": reviewsData.overallRating,
      "reviewCount": reviewsData.totalReviews,
      "bestRating": 5
    },
    "review": reviews
  }
}

// 모든 리뷰 키워드 추출
export function getAllReviewKeywords(): string[] {
  return reviewsData.seoKeywords
}
