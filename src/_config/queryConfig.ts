export const CACHE_CONFIG = {
  // 사용자별 변동 주기에 따른 캐시 전략
  SHEET_DATA: {
    ACTIVE_USER: {
      staleTime: 2 * 60 * 1000,    // 2분 (활발한 편집)
      gcTime: 10 * 60 * 1000,      // 10분
    },
    NORMAL_USER: {
      staleTime: 10 * 60 * 1000,   // 10분 (일반 사용)
      gcTime: 30 * 60 * 1000,      // 30분
    },
    INACTIVE_USER: {
      staleTime: 30 * 60 * 1000,   // 30분 (비활성)
      gcTime: 2 * 60 * 60 * 1000,  // 2시간
    }
  },
  
  // 메모리 관리
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  LARGE_DATA_THRESHOLD: 5 * 1024 * 1024, // 5MB
}

// 사용자 활성도 기반 캐시 전략
export const getCacheStrategy = (userActivity: 'active' | 'normal' | 'inactive') => {
  const activityKey = `${userActivity.toUpperCase()}_USER` as keyof typeof CACHE_CONFIG.SHEET_DATA
  return CACHE_CONFIG.SHEET_DATA[activityKey]
}

// Query Keys 관리
export const QUERY_KEYS = {
  checkAndLoad: (params: { spreadSheetId: string; chatId: string; userId: string; spreadSheetVersionId?: string | null }) =>
    ['checkAndLoad', params] as const,
  spreadSheet: (spreadSheetId: string) => ['spreadSheet', spreadSheetId] as const,
  chatHistory: (chatId: string) => ['chatHistory', chatId] as const,
}