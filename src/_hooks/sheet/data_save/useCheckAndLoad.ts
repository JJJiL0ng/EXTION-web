import { useState, useEffect } from 'react';
import { CheckAndLoadReq, CheckAndLoadRes } from "@/_types/apiConnector/check-and-load-api/chectAndLoadApi";
import { checkAndLoadApiConnector } from "@/_ApiConnector/sheet/checkAndLoadApi";
// getOrCreateGuestId, useSpreadsheetContext 등은 그대로 사용한다고 가정합니다.
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";
import { aiChatStore } from '@/_store/aiChat/aiChatStore';

/**
 * 컴포넌트 마운트 시, 스프레드시트/채팅 존재 여부를 서버에 확인하고(필요 시 로드)하는 커스텀 훅.
 */
export const useCheckAndLoadOnMount = (spreadSheetId: string, chatId: string, userId: string) => {
    const { spread } = useSpreadsheetContext();
    const { addLoadedPreviousMessages } = aiChatStore();

    const [loading, setLoading] = useState(true); // 처음에는 로딩 상태로 시작
    const [exists, setExists] = useState<boolean | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [response, setResponse] = useState<CheckAndLoadRes | null>(null);

    useEffect(() => {
        // ID 값이 아직 준비되지 않았다면 요청을 보내지 않음
        if (!spreadSheetId || !chatId) {
            setLoading(false);
            return;
        }

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
                        const jsonData = typeof (res as any).spreadSheetData === 'string'
                            ? JSON.parse((res as any).spreadSheetData)
                            : (res as any).spreadSheetData;

                        if (jsonData && spread) {
                            const sheet = spread.getActiveSheet();
                            sheet.suspendPaint();
                            try {
                                const deserializationOptions = {
                                    ignoreFormula: false,
                                    ignoreStyle: false,
                                    includeBindingSource: true,
                                    includeUnsupportedFormula: true,
                                    includeUnsupportedStyle: true,
                                } as const;
                                await spread.fromJSON(jsonData, deserializationOptions);
                                if (res.chatHistory) {
                                    addLoadedPreviousMessages(res.chatHistory);
                                }
                            } finally {
                                sheet.resumePaint();
                            }
                        }
                    } catch (loadErr) {
                        console.error('스프레드시트 로드 실패:', loadErr);
                    }
                }
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Unknown error in checkAndLoad');
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCheckAndLoad(); // 함수 실행

    // spreadSheetId, chatId, userId가 변경될 때마다 이 useEffect는 다시 실행됩니다.
    }, [spreadSheetId, chatId, userId, spread, addLoadedPreviousMessages]);

    // 이제 run 함수를 반환할 필요가 없습니다.
    return { exists };
};