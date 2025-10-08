import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { QUERY_KEYS } from '@/_aaa_sheetChat/_config/queryConfig'
import type { CheckAndLoadReq, CheckAndLoadRes } from '@/_aaa_sheetChat/_types/apiConnector/check-and-load-api/chectAndLoadApi'

export const useCacheInvalidation = () => {
  const queryClient = useQueryClient()

  // 특정 스프레드시트의 모든 캐시 무효화
  const invalidateSpreadSheet = useCallback((spreadSheetId: string) => {
    console.log('🗑️ [Cache Invalidation] 스프레드시트 캐시 무효화:', spreadSheetId)
    
    queryClient.invalidateQueries({
      queryKey: ['checkAndLoad'],
      predicate: (query) => {
        const params = query.queryKey[1] as CheckAndLoadReq
        return params?.spreadSheetId === spreadSheetId
      }
    })
  }, [queryClient])

  // 특정 채팅의 모든 캐시 무효화
  const invalidateChat = useCallback((chatId: string) => {
    console.log('🗑️ [Cache Invalidation] 채팅 캐시 무효화:', chatId)
    
    queryClient.invalidateQueries({
      queryKey: ['checkAndLoad'],
      predicate: (query) => {
        const params = query.queryKey[1] as CheckAndLoadReq
        return params?.chatId === chatId
      }
    })
  }, [queryClient])

  // 특정 사용자의 모든 캐시 무효화
  const invalidateUser = useCallback((userId: string) => {
    console.log('🗑️ [Cache Invalidation] 사용자 캐시 무효화:', userId)
    
    queryClient.invalidateQueries({
      queryKey: ['checkAndLoad'],
      predicate: (query) => {
        const params = query.queryKey[1] as CheckAndLoadReq
        return params?.userId === userId
      }
    })
  }, [queryClient])

  // 버전 기반 스마트 캐시 업데이트
  const updateCacheWithVersion = useCallback((
    params: CheckAndLoadReq,
    newSpreadSheetVersionId: string
  ) => {
    console.log('🔄 [Cache Update] 버전 기반 캐시 업데이트:', { params, newSpreadSheetVersionId })

    queryClient.setQueryData(
      QUERY_KEYS.checkAndLoad(params),
      (oldData: CheckAndLoadRes | undefined) => {
        if (!oldData) {
          return oldData
        }

        // 새 버전이 다르면 캐시 무효화
        if (oldData.spreadSheetVersionId !== newSpreadSheetVersionId) {
          console.log('🔄 [Cache Update] 새 버전 감지, 캐시 무효화 실행:', {
            old: oldData.spreadSheetVersionId,
            new: newSpreadSheetVersionId
          })
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.checkAndLoad(params)
          })
          return oldData
        }

        console.log('🔄 [Cache Update] 기존 버전 유지')
        return oldData
      }
    )
  }, [queryClient])

  // 수동으로 특정 캐시 데이터 설정
  const setCacheData = useCallback((
    params: CheckAndLoadReq,
    data: CheckAndLoadRes
  ) => {
    console.log('💾 [Cache Set] 수동 캐시 데이터 설정:', params)
    
    queryClient.setQueryData(QUERY_KEYS.checkAndLoad(params), data)
  }, [queryClient])

  // 전체 캐시 클리어 (메모리 관리용)
  const clearAllCache = useCallback(() => {
    console.log('🗑️ [Cache Clear] 전체 캐시 클리어')
    
    queryClient.clear()
  }, [queryClient])

  // 오래된 캐시만 제거 (메모리 최적화)
  const removeStaleCache = useCallback(() => {
    console.log('🧹 [Cache Cleanup] 오래된 캐시 정리')
    
    queryClient.removeQueries({
      predicate: (query) => {
        const { dataUpdatedAt } = query.state
        const now = Date.now()
        const oneHourAgo = now - (60 * 60 * 1000)
        
        return dataUpdatedAt < oneHourAgo
      }
    })
  }, [queryClient])

  return {
    invalidateSpreadSheet,
    invalidateChat, 
    invalidateUser,
    updateCacheWithVersion,
    setCacheData,
    clearAllCache,
    removeStaleCache,
  }
}