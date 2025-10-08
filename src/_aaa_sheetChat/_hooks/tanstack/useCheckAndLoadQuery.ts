import { useQuery } from '@tanstack/react-query'
import { checkAndLoadApiConnector } from '@/_aaa_sheetChat/_ApiConnector/sheet/checkAndLoadApi'
import { getCacheStrategy, QUERY_KEYS } from '@/_aaa_sheetChat/_config/queryConfig'
import type { CheckAndLoadReq, CheckAndLoadRes } from '@/_aaa_sheetChat/_types/apiConnector/check-and-load-api/chectAndLoadApi'

interface UseCheckAndLoadQueryOptions {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  userActivity?: 'active' | 'normal' | 'inactive'
  initialData?: CheckAndLoadRes
}

export const useCheckAndLoadQuery = (
  params: CheckAndLoadReq,
  options: UseCheckAndLoadQueryOptions = {}
) => {
  const { userActivity = 'normal', enabled = true, initialData, ...customOptions } = options
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

    // initialData가 제공되면 사용 (네트워크 요청 방지)
    initialData,
    
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
    
    // 새로고침 시 캐시 활용하여 무한 fetch 방지
    refetchOnMount: false,
  })
}

// 특정 사용 사례를 위한 편의 훅들
export const useActiveUserCheckAndLoad = (params: CheckAndLoadReq, enabled = true) => {
  return useCheckAndLoadQuery(params, { userActivity: 'active', enabled })
}

export const useInactiveUserCheckAndLoad = (params: CheckAndLoadReq, enabled = true) => {
  return useCheckAndLoadQuery(params, { userActivity: 'inactive', enabled })
}