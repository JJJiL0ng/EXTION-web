import { useQuery } from '@tanstack/react-query'
import { checkAndLoadApiConnector } from '@/_ApiConnector/sheet/checkAndLoadApi'
import { getCacheStrategy, QUERY_KEYS } from '@/_config/queryConfig'
import type { CheckAndLoadReq, CheckAndLoadRes } from '@/_types/apiConnector/check-and-load-api/chectAndLoadApi'

interface UseCheckAndLoadQueryOptions {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  userActivity?: 'active' | 'normal' | 'inactive'
}

export const useCheckAndLoadQuery = (
  params: CheckAndLoadReq, 
  options: UseCheckAndLoadQueryOptions = {}
) => {
  const { userActivity = 'normal', enabled = true, ...customOptions } = options
  const cacheStrategy = getCacheStrategy(userActivity)

  // 기본값 설정 (cacheStrategy가 undefined인 경우 대비)
  const defaultStaleTime = 10 * 60 * 1000 // 10분
  const defaultGcTime = 30 * 60 * 1000   // 30분

  return useQuery({
    queryKey: QUERY_KEYS.checkAndLoad(params),
    queryFn: () => checkAndLoadApiConnector(params),
    
    // 캐시 전략 적용 (fallback 포함)
    staleTime: customOptions.staleTime ?? cacheStrategy?.staleTime ?? defaultStaleTime,
    gcTime: customOptions.gcTime ?? cacheStrategy?.gcTime ?? defaultGcTime,
    
    enabled,
    
    // 대용량 데이터 최적화
    select: (data: CheckAndLoadRes) => {
      console.log('🔄 [TanStack Query] 캐시된 데이터 반환:', {
        exists: data.exists,
        version: data.latestVersion,
        hasSpreadSheetData: !!data.spreadSheetData,
        hasChatHistory: !!data.chatHistory,
        cacheStrategy: userActivity
      })
      
      return {
        ...data,
        // 필요시 데이터 변환/압축 로직 추가 가능
        spreadSheetData: data.spreadSheetData ? 
          JSON.parse(JSON.stringify(data.spreadSheetData)) : undefined
      }
    },
    
    // 에러 처리
    throwOnError: false,
    
    // 재시도 설정
    retry: (failureCount, error) => {
      // 네트워크 오류는 재시도, 클라이언트 오류는 재시도하지 않음
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 2
    },
    
    // 백그라운드 업데이트 설정
    refetchOnWindowFocus: userActivity === 'active',
    refetchOnReconnect: true,
    
    // 새로고침 시 캐시 무시하고 항상 새 데이터 가져오기
    refetchOnMount: 'always',
  })
}

// 특정 사용 사례를 위한 편의 훅들
export const useActiveUserCheckAndLoad = (params: CheckAndLoadReq, enabled = true) => {
  return useCheckAndLoadQuery(params, { userActivity: 'active', enabled })
}

export const useInactiveUserCheckAndLoad = (params: CheckAndLoadReq, enabled = true) => {
  return useCheckAndLoadQuery(params, { userActivity: 'inactive', enabled })
}