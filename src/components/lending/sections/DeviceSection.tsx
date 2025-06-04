import { DeviceHeader } from './DeviceHeader'
import { DeviceItem } from './DeviceItem'
import { devicesData, type Device } from '@/components/lending/data/devices'

interface DeviceSectionProps {
  devices?: Device[]
}

// SSG 최적화된 디바이스 섹션
export function DeviceSection({ devices = devicesData.devices }: DeviceSectionProps) {
  // 첫 번째 줄 (3개)과 두 번째 줄 (2개)로 분리
  const firstRowDevices = devices.slice(0, 3)
  const secondRowDevices = devices.slice(3, 5)

  return (
    <section className="py-20 bg-white" itemScope itemType="https://schema.org/ItemList">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* 헤더 섹션 - SSG 렌더링 */}
        <DeviceHeader />

        {/* 디바이스 그리드 - 3/2 레이아웃 */}
        <div className="space-y-8">
          {/* 첫 번째 줄 - 3개 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {firstRowDevices.map((device, index) => (
              <div
                key={device.id}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={(index + 1).toString()} />
                <div itemProp="item">
                  <DeviceItem 
                    device={device}
                    index={index}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 두 번째 줄 - 2개 (중앙 정렬) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {secondRowDevices.map((device, index) => (
              <div
                key={device.id}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={(index + 4).toString()} />
                <div itemProp="item">
                  <DeviceItem 
                    device={device}
                    index={index + 3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 추가 정보 섹션 */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              모든 플랫폼에서 동기화
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              어떤 디바이스에서 작업하든 모든 데이터가 실시간으로 동기화됩니다. <br />
              집에서는 데스크탑으로, 이동 중에는 웹으로 - 끊김 없는 작업 환경을 경험하세요.
            </p>
            
            {/* 동기화 기능 강조 */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">실시간 동기화</h4>
                <p className="text-sm text-gray-600">모든 변경사항이 즉시 반영</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">안전한 클라우드</h4>
                <p className="text-sm text-gray-600">데이터 암호화 및 백업</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">빠른 접근</h4>
                <p className="text-sm text-gray-600">어디서든 즉시 작업 시작</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 추가 SEO 정보 - 숨겨진 구조화된 데이터 */}
        <div className="hidden">
          <div itemScope itemType="https://schema.org/SoftwareApplication">
            <meta itemProp="name" content="Extion" />
            <meta itemProp="applicationCategory" content="ProductivityApplication" />
            <meta itemProp="description" content={devicesData.header.description} />
            
            {/* 모든 디바이스의 키워드 통합 */}
            <meta itemProp="keywords" content={
              devicesData.devices
                .flatMap(d => d.keywords)
                .join(', ')
            } />
            
            {/* 지원 운영체제 통합 */}
            <meta itemProp="operatingSystem" content={
              devicesData.devices
                .flatMap(d => d.compatibility)
                .filter((os, index, arr) => arr.indexOf(os) === index)
                .join(', ')
            } />
            
            {/* 모든 기능 통합 */}
            {devicesData.devices.flatMap(d => d.features).map((feature, index) => (
              <meta key={index} itemProp="featureList" content={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 