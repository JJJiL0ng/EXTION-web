import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckAndLoadReq, CheckAndLoadRes } from "@/_types/apiConnector/check-and-load-api/chectAndLoadApi";
import { checkAndLoadApiConnector } from "@/_ApiConnector/sheet/checkAndLoadApi";
// getOrCreateGuestId, useSpreadsheetContext 등은 그대로 사용한다고 가정합니다.
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";
import { aiChatStore } from '@/_store/aiChat/aiChatStore';
import { useSheetRender } from '@/_hooks/sheet/spreadjs/useSheetRender';
import { useSpreadsheetUploadStore } from '@/_store/sheet/spreadsheetUploadStore';

/**
 * 컴포넌트 마운트 시, 스프레드시트/채팅 존재 여부를 서버에 확인하고(필요 시 로드)하는 커스텀 훅.
 */
export const useCheckAndLoadOnMount = (spreadSheetId: string, chatId: string, userId: string) => {
    const { spread } = useSpreadsheetContext();
    const { addLoadedPreviousMessages } = aiChatStore();
    const { setIsFileUploaded } = useSpreadsheetUploadStore();
    
    // useSheetRender 훅 사용 - 백엔드 데이터를 파일 업로드처럼 처리
    const { renderBackendData, renderState } = useSheetRender({
        onSuccess: (fileName) => {
            setIsFileUploaded(true);
        },
        onError: (error, fileName) => {
            console.error('❌ [useCheckAndLoad] 백엔드 데이터 렌더링 실패:', { error, fileName });
        }
    });

    const [loading, setLoading] = useState(true); // 처음에는 로딩 상태로 시작
    const [exists, setExists] = useState<boolean | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [response, setResponse] = useState<CheckAndLoadRes | null>(null);
    
    // API 호출 중복 방지를 위한 ref
    const isApiCalledRef = useRef(false);
    const currentParamsRef = useRef<string>('');

    useEffect(() => {
        // 현재 파라미터로 고유 키 생성
        const currentParams = `${spreadSheetId}-${chatId}-${userId}`;
        
        // ID 값이 아직 준비되지 않았다면 요청을 보내지 않음
        if (!spreadSheetId || !chatId) {
            setLoading(false);
            return;
        }
        
        // spread 인스턴스가 준비될 때까지 대기
        if (!spread) {
            setLoading(false);
            return;
        }

        // 이미 같은 파라미터로 API 호출을 했다면 중단
        if (isApiCalledRef.current && currentParamsRef.current === currentParams) {
            return;
        }
        
        // 현재 파라미터 저장 및 호출 플래그 설정
        currentParamsRef.current = currentParams;
        isApiCalledRef.current = true;
        
        // API를 호출하는 비동기 함수를 내부에 선언
        const fetchCheckAndLoad = async () => {
            setLoading(true); // 재호출될 경우를 대비해 다시 로딩 상태로
            setError(null);
            try {
                const payload: CheckAndLoadReq = {
                    spreadSheetId,
                    chatId,
                    userId,
                };

                const res = await checkAndLoadApiConnector(payload);
                setResponse(res);
                setExists(res.exists);

                if (res.exists) {
                    // 스프레드시트 데이터 로드 로직
                    try {
                        // 올바른 데이터 접근 방식: res.spreadSheetData (타입에 맞게)
                        const jsonData = typeof res.spreadSheetData === 'string'
                            ? JSON.parse(res.spreadSheetData)
                            : res.spreadSheetData;

                        if (jsonData && spread) {
                            // useSheetRender의 renderBackendData 함수 사용 - 파일 업로드와 동일한 방식
                            await renderBackendData(
                                jsonData, 
                                spread, 
                                `스프레드시트-${spreadSheetId.substring(0, 8)}.json`
                            );
                            
                            // 채팅 히스토리 로드 (renderBackendData와 별도 처리)
                            if (res.chatHistory) {
                                addLoadedPreviousMessages(res.chatHistory);
                            }
                        }
                    } catch (loadErr) {
                        console.error('❌ [useCheckAndLoad] 스프레드시트 로드 실패:', {
                            error: loadErr,
                            errorMessage: loadErr instanceof Error ? loadErr.message : 'Unknown error',
                            errorStack: loadErr instanceof Error ? loadErr.stack : undefined
                        });
                        setError(loadErr instanceof Error ? loadErr : new Error('데이터 로드 실패'));
                    }
                }
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Unknown error in checkAndLoad');
                console.error('❌ [useCheckAndLoad] API 호출 에러:', err);
                setError(err);
                // 에러 발생 시 ref 리셋하여 재시도 가능하도록
                isApiCalledRef.current = false;
                currentParamsRef.current = '';
            } finally {
                setLoading(false);
            }
        };

        fetchCheckAndLoad(); // 함수 실행

    // spread가 준비된 후에만 실행되도록 조정
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spreadSheetId, chatId, userId, spread, addLoadedPreviousMessages]);

    // exists와 렌더링 상태 정보 반환
    return { 
        exists, 
        loading, 
        error,
        renderState,  // useSheetRender의 상태 정보
        response 
    };
};