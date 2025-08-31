// 디바이스 섹션 정적 데이터 - SSG 최적화
export interface Device {
  id: number
  name: string
  description: string
  icon: string
  features: string[]
  status: 'available' | 'coming-soon'
  downloadUrl?: string
  learnMoreUrl?: string
  keywords: string[]
  compatibility: string[]
}

export const devicesData = {
  // 섹션 헤더 정보
  header: {
    title: "어디서든 사용하세요",
    subtitle: "모든 플랫폼에서 동일한 AI 엑셀 경험을",
    description: "웹, 데스크탑, 클라우드까지 - 당신이 일하는 모든 곳에서 Extion을 만나보세요"
  },
  
  // 지원 디바이스 목록
  devices: [
    {
      id: 1,
      name: "웹 브라우저",
      description: "브라우저에서 바로 사용하세요. Chrome, Safari, Edge 모두 지원합니다.",
      icon: "🌐",
      features: [
        "설치 불필요",
        "실시간 동기화",
        "모든 브라우저 지원",
        "클라우드 저장"
      ],
      status: "available" as const,
      downloadUrl: "https://app.extion.co",
      keywords: ["웹앱", "브라우저", "온라인", "클라우드"],
      compatibility: ["Chrome", "Safari", "Edge", "Firefox"]
    },
    {
      id: 2,
      name: "Windows 데스크탑",
      description: "Windows 10/11에서 네이티브 앱으로 더 빠르고 안정적인 성능을 경험하세요.",
      icon: "🖥️",
      features: [
        "네이티브 성능",
        "오프라인 작업",
        "시스템 통합",
        "단축키 지원"
      ],
      status: "available" as const,
      downloadUrl: "https://download.extion.co/windows",
      keywords: ["윈도우", "데스크탑", "네이티브", "오프라인"],
      compatibility: ["Windows 10", "Windows 11"]
    },
    {
      id: 3,
      name: "macOS 데스크탑",
      description: "macOS에 최적화된 앱으로 Mac 사용자를 위한 완벽한 엑셀 AI 경험을 제공합니다.",
      icon: "🍎",
      features: [
        "macOS 최적화",
        "Touch Bar 지원",
        "Spotlight 검색",
        "iCloud 연동"
      ],
      status: "available" as const,
      downloadUrl: "https://download.extion.co/mac",
      keywords: ["맥", "macOS", "애플", "Touch Bar"],
      compatibility: ["macOS 11+", "Intel", "Apple Silicon"]
    },
    {
      id: 4,
      name: "Google Sheets",
      description: "구글 스프레드시트에서 직접 AI 기능을 사용하세요. 기존 워크플로우를 그대로 유지할 수 있습니다.",
      icon: "📊",
      features: [
        "애드온 설치",
        "기존 시트 연동",
        "실시간 협업",
        "구글 드라이브 연동"
      ],
      status: "available" as const,
      downloadUrl: "https://workspace.google.com/marketplace/app/extion",
      keywords: ["구글시트", "스프레드시트", "애드온", "협업"],
      compatibility: ["Google Workspace", "개인 계정"]
    },
    {
      id: 5,
      name: "Microsoft 365",
      description: "Office 365 Excel에서 Extion AI를 바로 사용하세요. 기업 환경에 완벽하게 통합됩니다.",
      icon: "📈",
      features: [
        "Excel 애드인",
        "Teams 연동",
        "OneDrive 동기화",
        "기업 보안"
      ],
      status: "coming-soon" as const,
      learnMoreUrl: "https://extion.co/office365",
      keywords: ["오피스365", "엑셀", "애드인", "기업"],
      compatibility: ["Office 365", "Excel 2019+"]
    }
  ] as Device[]
} as const

// 디바이스별 아이콘 매핑 함수
export const getDeviceIcon = (id: number): string => {
  const device = devicesData.devices.find(d => d.id === id)
  return device?.icon || '💻'
}

// 디바이스 섹션 구조화된 데이터 생성
export function generateDevicesStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Extion",
    "applicationCategory": "ProductivityApplication",
    "description": devicesData.header.description,
    "operatingSystem": devicesData.devices
      .flatMap(device => device.compatibility)
      .filter((os, index, arr) => arr.indexOf(os) === index)
      .join(', '),
    "softwareRequirements": devicesData.devices.map(device => ({
      "@type": "SoftwareApplication",
      "name": device.name,
      "description": device.description,
      "operatingSystem": device.compatibility.join(', '),
      "applicationCategory": "ProductivityApplication",
      "downloadUrl": device.downloadUrl || device.learnMoreUrl,
      "featureList": device.features
    })),
    "offers": devicesData.devices
      .filter(device => device.status === 'available')
      .map(device => ({
        "@type": "Offer",
        "name": device.name,
        "description": device.description,
        "price": "0",
        "priceCurrency": "KRW",
        "availability": "https://schema.org/InStock",
        "url": device.downloadUrl
      }))
  }
}

// 플랫폼별 호환성 정보 구조화된 데이터
export function generateCompatibilityStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "지원 플랫폼",
    "description": "Extion이 지원하는 모든 플랫폼과 디바이스",
    "numberOfItems": devicesData.devices.length,
    "itemListElement": devicesData.devices.map((device, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": device.name,
        "description": device.description,
        "operatingSystem": device.compatibility.join(', '),
        "featureList": device.features,
        "keywords": device.keywords.join(', '),
        "applicationCategory": "ProductivityApplication"
      }
    }))
  }
}

// SEO용 키워드 추출
export function getAllDeviceKeywords(): string[] {
  return devicesData.devices.flatMap(device => device.keywords)
}

// 호환성 정보 추출
export function getAllCompatibility(): string[] {
  return devicesData.devices
    .flatMap(device => device.compatibility)
    .filter((os, index, arr) => arr.indexOf(os) === index)
} 