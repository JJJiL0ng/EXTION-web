import { VideoPlayer } from '@/components/ui/VideoPlayer'

interface Feature {
  id: number
  title: string
  subtitle: string
  description: string
  example: string
  videoUrl: string
}

interface FeatureSectionProps {
  features: Feature[]
}

// 각 기능에 맞는 아이콘 매핑
const getFeatureIcon = (id: number) => {
  switch (id) {
    case 1:
      return '💬' // 자연어 명령 처리
    case 2:
      return '📊' // 표 자동 정리
    case 3:
      return '📈' // 시각화 기능
    default:
      return '✨'
  }
}

export function FeatureSection({ features }: FeatureSectionProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            핵심 기능
          </h2>
          <p className="text-xl text-gray-600">
            자연어로 엑셀 작업이 이렇게 쉬워집니다
          </p>
        </div>

        <div className="space-y-20">
          {features.map((feature, index) => (
            <div 
              key={feature.id} 
              className={`flex flex-col lg:flex-row items-center gap-12 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* 텍스트 영역 */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                </div>
                
                <h4 className="text-xl font-semibold text-blue-600">
                  {feature.subtitle}
                </h4>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                  <p className="text-gray-700">
                    <span className="text-blue-600 font-medium"></span> {feature.example}
                  </p>
                </div>
              </div>

              {/* 영상 영역 */}
              <div className="flex-1">
                <VideoPlayer 
                  src={feature.videoUrl}
                  poster={`/images/feature-${feature.id}-thumbnail.jpg`}
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}