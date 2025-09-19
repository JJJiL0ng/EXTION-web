import { useEffect, useCallback, useRef } from 'react';
import { useCheckAndLoadQuery } from '@/_hooks/tanstack/useCheckAndLoadQuery';
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";
import { aiChatStore } from '@/_store/aiChat/aiChatStore';
import { useSheetRender } from '@/_hooks/sheet/spreadjs/useSheetRender';
import { useSpreadsheetUploadStore } from '@/_store/sheet/spreadsheetUploadStore';

/**
 * 컴포넌트 마운트 시, 스프레드시트/채팅 존재 여부를 서버에 확인하고(필요 시 로드)하는 커스텀 훅.
 * TanStack Query 기반으로 개선된 버전
 */
export const useCheckAndLoadOnMount = (
    spreadSheetId: string, 
    chatId: string, 
    userId: string,
    userActivity: 'active' | 'normal' | 'inactive' = 'normal'
) => {
    const { spread } = useSpreadsheetContext();
    const { addLoadedPreviousMessages } = aiChatStore();
    const { setIsFileUploaded } = useSpreadsheetUploadStore();
    
    // 중복 실행 방지를 위한 ref
    const isDataLoadedRef = useRef(false);
    const loadedResponseIdRef = useRef<string | null>(null);
    
    // useSheetRender 훅 사용 - 백엔드 데이터를 파일 업로드처럼 처리
    const { renderBackendData, renderState } = useSheetRender({
        onSuccess: (fileName) => {
            setIsFileUploaded(true);
            console.log('✅ [useCheckAndLoad] 스프레드시트 렌더링 성공:', fileName);
        },
        onError: (error, fileName) => {
            console.error('❌ [useCheckAndLoad] 백엔드 데이터 렌더링 실패:', { error, fileName });
        }
    });

    // TanStack Query로 데이터 페칭
    const { 
        data: response, 
        isLoading: loading, 
        error,
        isSuccess,
        isFetching
    } = useCheckAndLoadQuery(
        { spreadSheetId, chatId, userId },
        {
            enabled: !!(spreadSheetId && chatId && userId), // spread 조건 제거 - 먼저 데이터를 가져온 후 spread가 준비되면 렌더링
            userActivity,
            staleTime: userActivity === 'active' ? 2 * 60 * 1000 : 10 * 60 * 1000, // 활성 사용자는 2분, 일반은 10분
        }
    );

    console.log('🔍 [useCheckAndLoad] 현재 상태:', {
        spreadSheetId,
        chatId,
        userId,
        hasSpread: !!spread,
        loading,
        isFetching,
        isSuccess,
        hasResponse: !!response,
        responseExists: response?.exists,
        enabled: !!(spreadSheetId && chatId && userId)
    });

    // 안정적인 함수 참조를 위한 useCallback
    const stableAddLoadedPreviousMessages = useCallback((messages: any[]) => {
        addLoadedPreviousMessages(messages);
    }, [addLoadedPreviousMessages]);

    // renderBackendData를 useCallback으로 안정화
    const stableRenderBackendData = useCallback(renderBackendData, [renderBackendData]);

    // 데이터 로드 효과 처리
    useEffect(() => {
        console.log('🔍 [useCheckAndLoad] useEffect 실행 조건 체크:', {
            isSuccess,
            responseExists: response?.exists,
            hasSpread: !!spread,
            hasSpreadSheetData: !!response?.spreadSheetData,
            hasChatHistory: !!response?.chatHistory,
            isDataLoaded: isDataLoadedRef.current,
            currentResponseId: loadedResponseIdRef.current
        });

        // 성공하지 않았거나 데이터가 존재하지 않으면 early return
        if (!isSuccess || !response?.exists) {
            console.log('⏸️ [useCheckAndLoad] 조건 미충족으로 데이터 로드 건너뜀');
            return;
        }

        // 응답 ID 생성 (중복 실행 방지용)
        const responseId = `${spreadSheetId}-${chatId}-${response.latestVersion || 'unknown'}`;

        // 이미 같은 응답을 처리했다면 건너뜀
        if (loadedResponseIdRef.current === responseId) {
            console.log('⏸️ [useCheckAndLoad] 이미 처리된 응답, 건너뜀:', responseId);
            return;
        }

        // 현재 응답 ID 저장
        loadedResponseIdRef.current = responseId;

        // 채팅 히스토리 로드 (한 번만)
        if (response.chatHistory && response.chatHistory.length > 0) {
            console.log('🔄 [useCheckAndLoad] 채팅 히스토리 로드 시작');
            stableAddLoadedPreviousMessages(response.chatHistory);
            console.log('✅ [useCheckAndLoad] 채팅 히스토리 로드 완료:', response.chatHistory.length);
        }

        // spread가 준비되지 않았으면 스프레드시트 렌더링은 나중에
        if (!spread) {
            console.log('⏳ [useCheckAndLoad] spread 인스턴스 대기 중...');
            return;
        }

        const loadSpreadsheetData = async () => {
            try {
                console.log('🔄 [useCheckAndLoad] 스프레드시트 데이터 로드 시작');

                // 스프레드시트 데이터 처리
                const jsonData = typeof response.spreadSheetData === 'string'
                    ? JSON.parse(response.spreadSheetData)
                    : response.spreadSheetData;

                if (jsonData) {
                    console.log('🔄 [useCheckAndLoad] 스프레드시트 데이터 렌더링 시작');

                    // useSheetRender의 renderBackendData 함수 사용
                    await stableRenderBackendData(
                        jsonData,
                        spread,
                        `스프레드시트-${spreadSheetId.substring(0, 8)}.json`
                    );

                    console.log('✅ [useCheckAndLoad] 스프레드시트 데이터 렌더링 완료');
                    isDataLoadedRef.current = true;
                } else {
                    console.log('ℹ️ [useCheckAndLoad] 스프레드시트 데이터가 없음');
                }

            } catch (loadErr) {
                console.error('❌ [useCheckAndLoad] 스프레드시트 로드 실패:', {
                    error: loadErr,
                    errorMessage: loadErr instanceof Error ? loadErr.message : 'Unknown error',
                    errorStack: loadErr instanceof Error ? loadErr.stack : undefined
                });
            }
        };

        loadSpreadsheetData();
    }, [isSuccess, response, spread, spreadSheetId, stableAddLoadedPreviousMessages, stableRenderBackendData]);

    // 기존 인터페이스 유지 - exists 필드 추가
    const exists = response?.exists ?? null;

    // exists와 렌더링 상태 정보 반환 (기존 인터페이스 유지)
    return { 
        exists, 
        loading, 
        error: error as Error | null,
        renderState,  // useSheetRender의 상태 정보
        response 
    };
};