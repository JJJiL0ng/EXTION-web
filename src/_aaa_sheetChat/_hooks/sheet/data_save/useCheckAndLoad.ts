import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useCheckAndLoadQuery } from '@/_aaa_sheetChat/_hooks/tanstack/useCheckAndLoadQuery';
import { useSpreadsheetContext } from "@/_aaa_sheetChat/_contexts/SpreadsheetContext";
import { aiChatStore } from '@/_aaa_sheetChat/_store/aiChat/aiChatStore';
import { useSheetRender } from '@/_aaa_sheetChat/_hooks/sheet/spreadjs/useSheetRender';
import { useSpreadsheetUploadStore } from '@/_aaa_sheetChat/_store/sheet/spreadsheetUploadStore';
import { useQueryClient } from '@tanstack/react-query';
import { getCheckAndLoadParamsFromQueryKey } from '@/_aaa_sheetChat/_config/queryKeys';
import type { CheckAndLoadRes } from '@/_aaa_sheetChat/_types/apiConnector/check-and-load-api/chectAndLoadApi';
import { useSpreadSheetVersionStore } from '@/_aaa_sheetChat/_store/sheet/spreadSheetVersionIdStore';
import useFileNameStore from '@/_aaa_sheetChat/_store/sheet/fileNameStore';
import useChatStore from '@/_aaa_sheetChat/_store/chat/chatIdAndChatSessionIdStore';
/**
 * 컴포넌트 마운트 시, 스프레드시트/채팅 존재 여부를 서버에 확인하고(필요 시 로드)하는 커스텀 훅.
 * TanStack Query 기반으로 개선된 버전
 */
export const useCheckAndLoadOnMount = (
    spreadSheetId: string,
    chatId: string,
    userId: string,
    userActivity: 'active' | 'normal' | 'inactive' = 'normal',
    spreadSheetVersionId: string | null
) => {
    const { spread } = useSpreadsheetContext();
    const { addLoadedPreviousMessages } = aiChatStore();
    const { setIsFileUploaded } = useSpreadsheetUploadStore();
    const { setSpreadSheetVersion } = useSpreadSheetVersionStore();
    const queryClient = useQueryClient();

    // 중복 실행 방지를 위한 ref
    const processedResponsesRef = useRef<Set<string>>(new Set());

    // 이전 버전의 캐시된 데이터를 찾아서 initialData로 사용
    const getPreviousData = useCallback((): CheckAndLoadRes | undefined => {
        if (!spreadSheetVersionId) return undefined;

        // 현재 캐시에서 다른 버전 ID를 가진 동일한 spreadSheetId, chatId, userId 조합의 데이터를 찾기
        const queryCache = queryClient.getQueryCache();

        for (const query of queryCache.getAll()) {
            const params = getCheckAndLoadParamsFromQueryKey(query.queryKey);

            // 같은 spreadSheetId, chatId, userId이지만 다른 spreadSheetVersionId인 경우
            if (
                params?.spreadSheetId === spreadSheetId &&
                params.chatId === chatId &&
                params.userId === userId &&
                params.spreadSheetVersionId !== spreadSheetVersionId &&
                query.state.data
            ) {
                console.log('🔄 [useCheckAndLoad] 이전 버전 데이터 발견, initialData로 사용:', {
                    previousVersionId: params.spreadSheetVersionId,
                    currentVersionId: spreadSheetVersionId
                });
                return query.state.data as CheckAndLoadRes;
            }
        }

        return undefined;
    }, [queryClient, spreadSheetId, chatId, userId, spreadSheetVersionId]);

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

    // 이전 데이터 조회
    const previousData = useMemo(() => getPreviousData(), [getPreviousData]);

    // TanStack Query로 데이터 페칭
    const {
        data: response,
        isLoading: loading,
        error,
        isSuccess
    } = useCheckAndLoadQuery(
        { spreadSheetId, chatId, userId, spreadSheetVersionId },
        {
            enabled: !!(spreadSheetId && chatId && userId), // spread 조건 제거 - 먼저 데이터를 가져온 후 spread가 준비되면 렌더링
            userActivity,
            staleTime: userActivity === 'active' ? 2 * 60 * 1000 : 10 * 60 * 1000, // 활성 사용자는 2분, 일반은 10분
            initialData: previousData, // 이전 버전의 데이터를 initialData로 제공
        }
    );

    // console.log('🔍 [useCheckAndLoad] 현재 상태:', {
    //     spreadSheetId,
    //     chatId,
    //     userId,
    //     spreadSheetVersionId,
    //     hasSpread: !!spread,
    //     loading,
    //     isFetching,
    //     isSuccess,
    //     hasResponse: !!response,
    //     responseExists: response?.exists,
    //     enabled: !!(spreadSheetId && chatId && userId)
    // });

    // 안정적인 함수 참조를 위한 useCallback
    const stableAddLoadedPreviousMessages = useCallback((messages: any[]) => {
        addLoadedPreviousMessages(messages);
    }, [addLoadedPreviousMessages]);

    // renderBackendData 함수를 memo화하여 안정화
    const memoizedRenderBackendData = useMemo(() => renderBackendData, [renderBackendData]);

    // 안정적인 값들 추출 - 값이 실제로 변경되었을 때만 리렌더링되도록 memo 사용
    const responseExists = useMemo(() => response?.exists, [response?.exists]);
    const responseFileName = useMemo(() => response?.fileName, [response?.fileName]);
    const responseChatHistory = useMemo(() => response?.chatHistory, [response?.chatHistory]);
    const responseSpreadSheetData = useMemo(() => response?.spreadSheetData, [response?.spreadSheetData]);
    const responseSpreadSheetVersionId = useMemo(() => response?.spreadSheetVersionId, [response?.spreadSheetVersionId]);
    const responseChatSessionId = useMemo(() => response?.chatSessionId, [response?.chatSessionId]);
    // 현재 스토어의 버전 ID 가져오기 (중복 업데이트 방지용)
    const currentVersionId = useSpreadSheetVersionStore(state => state.spreadSheetVersionId);

    // 데이터 로드 효과 처리
    useEffect(() => {
        // 성공하지 않았거나 데이터가 존재하지 않으면 early return
        if (!isSuccess || !responseExists) {
            return;
        }

        // 응답 ID 생성 (중복 실행 방지용) - 파일명도 포함하여 중복 처리 방지
        const responseId = `${spreadSheetId}-${chatId}-${responseFileName}-${!!responseSpreadSheetData}-${!!responseChatHistory}-${responseSpreadSheetVersionId}`;

        // 이미 같은 응답을 처리했다면 건너뜀
        if (processedResponsesRef.current.has(responseId)) {
            return;
        }

        // 현재 응답 ID를 처리된 목록에 추가
        processedResponsesRef.current.add(responseId);

        // 파일명 업데이트 - 서버에서 오는 응답이므로 setFileNameFromServer 사용
        if (responseFileName) {
            console.log('📝 [useCheckAndLoad] 서버로부터 파일명 업데이트 시도:', responseFileName);
            useFileNameStore.getState().setFileNameFromServer(responseFileName);
        }

        // spreadSheetVersionId를 상태관리에 저장 (중복 업데이트 방지)
        if (responseSpreadSheetVersionId && responseSpreadSheetVersionId !== currentVersionId) {
            console.log('🔄 SpreadSheet Version 업데이트:', responseSpreadSheetVersionId);
            setSpreadSheetVersion(responseSpreadSheetVersionId);
        }
        // chatSessionId를 aiChatStore에 저장
        if (responseChatSessionId) {        
            useChatStore.getState().setChatSessionId(responseChatSessionId);
        }

        // 채팅 히스토리 로드 (한 번만)
        if (responseChatHistory && responseChatHistory.length > 0) {
            console.log('🔄 [useCheckAndLoad] 채팅 히스토리 로드 시작');
            stableAddLoadedPreviousMessages(responseChatHistory);
            console.log('✅ [useCheckAndLoad] 채팅 히스토리 로드 완료:', responseChatHistory.length);
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
                const jsonData = typeof responseSpreadSheetData === 'string'
                    ? JSON.parse(responseSpreadSheetData)
                    : responseSpreadSheetData;

                if (jsonData) {
                    console.log('🔄 [useCheckAndLoad] 스프레드시트 데이터 렌더링 시작');

                    // useSheetRender의 renderBackendData 함수 사용
                    await memoizedRenderBackendData(
                        jsonData,
                        spread,
                        `스프레드시트-${spreadSheetId.substring(0, 8)}.json`
                    );

                    console.log('✅ [useCheckAndLoad] 스프레드시트 데이터 렌더링 완료');
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
    }, [
        isSuccess,
        responseExists,
        responseChatHistory,
        responseSpreadSheetData,
        responseSpreadSheetVersionId,
        currentVersionId,
        spread,
        spreadSheetId,
        chatId,
        stableAddLoadedPreviousMessages,
        memoizedRenderBackendData,
        setSpreadSheetVersion,
        responseFileName // responseId에 포함되므로 안전하게 포함
    ]);

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
