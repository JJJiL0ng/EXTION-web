import { devicesData } from '@/_lending/lendingComponents/lending/data/devices'

// SSG로 렌더링되는 디바이스 섹션 헤더
export function DeviceHeader() {
  return (
    <div className="text-center mb-16">
      {/* 메인 제목 - SEO 최적화 */}
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        {devicesData.header.title}
      </h2>
      
      {/* 서브 제목 */}
      <p className="text-xl text-gray-600 mb-6">
        {devicesData.header.subtitle}
      </p>
      
      {/* 상세 설명 - SEO용 */}
      <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
        {devicesData.header.description}
      </p>
      
      {/* 구조화된 데이터 - 숨겨진 SEO 정보 */}
      <div className="hidden" itemScope itemType="https://schema.org/SoftwareApplication">
        <meta itemProp="name" content="Extion" />
        <meta itemProp="applicationCategory" content="ProductivityApplication" />
        <meta itemProp="description" content={devicesData.header.description} />
        
        {/* 지원 운영체제 */}
        <meta itemProp="operatingSystem" content={
          devicesData.devices
            .flatMap(device => device.compatibility)
            .filter((os, index, arr) => arr.indexOf(os) === index)
            .join(', ')
        } />
        
        {/* 각 디바이스의 키워드들 */}
        {devicesData.devices.map((device, index) => (
          <div key={device.id} itemProp="softwareRequirements" itemScope itemType="https://schema.org/SoftwareApplication">
            <meta itemProp="name" content={device.name} />
            <meta itemProp="description" content={device.description} />
            <meta itemProp="operatingSystem" content={device.compatibility.join(', ')} />
            <meta itemProp="keywords" content={device.keywords.join(', ')} />
          </div>
        ))}
      </div>
    </div>
  )
} 