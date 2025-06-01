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
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ✅ {feature.id}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900">
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
                    <span className="text-blue-600 font-medium">🔹 예시:</span> {feature.example}
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