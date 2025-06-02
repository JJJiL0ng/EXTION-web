import type { Device } from '@/data/devices'
import Image from 'next/image'

interface DeviceItemProps {
  device: Device
  index: number
}

// 디바이스별 로고 이미지 매핑
const getDeviceLogo = (deviceName: string): string => {
  const logoMap: { [key: string]: string } = {
    "웹 브라우저": "/Chrome.png",
    "Windows 데스크탑": "/Window.png",
    "macOS 데스크탑": "/Apple.png",
    "Google Sheets": "/Gss.png",
    "Microsoft 365": "/Excel.png"
  }
  
  return logoMap[deviceName] || "/Chrome.png"
}

// SSG로 렌더링되는 개별 디바이스 아이템
export function DeviceItem({ device, index }: DeviceItemProps) {
  const logoSrc = getDeviceLogo(device.name)

  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
      itemScope 
      itemType="https://schema.org/SoftwareApplication"
    >
      {/* 구조화된 데이터 - 디바이스 메타데이터 */}
      <meta itemProp="name" content={device.name} />
      <meta itemProp="description" content={device.description} />
      <meta itemProp="operatingSystem" content={device.compatibility.join(', ')} />
      <meta itemProp="applicationCategory" content="ProductivityApplication" />
      <meta itemProp="keywords" content={device.keywords.join(', ')} />
      
      {/* 헤더 영역 */}
      <div className="text-center mb-6">
        {/* 로고 이미지 - Next.js Image 컴포넌트 사용 */}
        <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 p-3">
          <Image
            src={logoSrc}
            alt={`${device.name} 로고`}
            width={40}
            height={40}
            className="object-contain"
            priority={index < 3} // 첫 3개 이미지는 우선 로드
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>
        
        {/* 제목 */}
        <h3 className="text-xl font-bold text-gray-900 mb-2" itemProp="name">
          {device.name}
        </h3>
      </div>
      
      {/* 설명 */}
      <p className="text-gray-600 leading-relaxed mb-6 text-center" itemProp="description">
        {device.description}
      </p>
      
      {/* 기능 목록 - SEO 최적화 */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">주요 기능</h4>
        <div className="space-y-2">
          {device.features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700" itemProp="featureList">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 호환성 정보 */}
      <div className="text-center">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">호환성</h4>
        <div className="flex flex-wrap gap-2 justify-center">
          {device.compatibility.map((os, osIndex) => (
            <span 
              key={osIndex} 
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
              itemProp="operatingSystem"
            >
              {os}
            </span>
          ))}
        </div>
      </div>
      
      {/* 숨겨진 키워드 - SEO용 */}
      <div className="hidden">
        {device.keywords.map((keyword, keywordIndex) => (
          <span key={keywordIndex} itemProp="keywords">{keyword}</span>
        ))}
      </div>
    </div>
  )
}