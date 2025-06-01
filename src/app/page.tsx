import { HeroSection } from '@/components/sections/HeroSection'
import { FeatureSection } from '@/components/sections/FeatureSection'
import { CTASection } from '@/components/sections/CTASection'

// SSR로 정적 데이터 미리 렌더링
export default async function HomePage() {
  // 서버에서 미리 가져올 데이터가 있다면 여기서
  const featuresData = {
    features: [
      {
        id: 1,
        title: "자연어 명령 처리",
        subtitle: "말 한마디로 엑셀 자동 실행!",
        description: "정렬해줘, 차트로 보여줘처럼 대화하듯 입력만 하면, 복잡한 엑셀 작업이 자동으로 처리됩니다.",
        example: "매출표 정리해줘 → 병합 + 정렬 + 필터까지 자동 처리 완료!",
        videoUrl: "https://video.extion.co/hero-sample.mp4"
      },
      {
        id: 2,
        title: "표 자동 정리",
        subtitle: "지저분한 데이터? 한 번에 깔끔하게!",
        description: "병합 셀, 중복값, 비어있는 셀 등을 자동으로 정리해서 읽기 쉬운 표로 재구성합니다.",
        example: "지출내역 정리해줘 → 비어 있는 셀, 중복 제거, 표 스타일 정리까지 한 번에!",
        videoUrl: "https://pub-4a3591bf83af49968ea0c99fbe105456.r2.dev/hero-sample.mp4"
      },
      {
        id: 3,
        title: "시각화 기능",
        subtitle: "그래프? 그냥 말하면 그려줍니다.",
        description: "데이터를 분석해 가장 어울리는 차트를 자동 추천 + 생성합니다.",
        example: "이번 달 지출 차트로 보여줘 → 막대그래프 자동 생성, 컬러와 레이블까지 깔끔하게!",
        videoUrl: "/videos/feature-3.mp4"
      }
    ]
  }

  return (
    <main>
      <HeroSection />
      <FeatureSection features={featuresData.features} />
      <CTASection />
    </main>
  )
}