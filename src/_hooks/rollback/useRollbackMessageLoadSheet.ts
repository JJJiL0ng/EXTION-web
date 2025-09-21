import { rollbackMessageReq, rollbackMessageRes } from "@/_types/apiConnector/ai-chat-api/rollbackMessageApi.types";
import { AiChatApiConnector } from "@/_ApiConnector/ai-chat/aiChatApiConnector";
import { useState } from "react";
import { useSpreadSheetVersionStore } from "@/_store/sheet/spreadSheetVersionIdStore";
import { useSheetRender } from "@/_hooks/sheet/spreadjs/useSheetRender";
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";

export const useRollbackMessageLoadSheet = (apiConnector: AiChatApiConnector) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { spread } = useSpreadsheetContext();

    const { renderBackendData, renderState } = useSheetRender({
        onSuccess: (fileName) => {
            console.log('✅ [useRollbackMessageLoadSheet] 스프레드시트 렌더링 성공:', fileName);
        },
        onError: (error, fileName) => {
            console.error('❌ [useRollbackMessageLoadSheet] 백엔드 데이터 렌더링 실패:', { error, fileName });
        }
    });

    const rollbackMessage = async (request: rollbackMessageReq): Promise<rollbackMessageRes | null> => {
        if (!apiConnector.connected) {
            setError('API connector is not connected');
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            return new Promise<rollbackMessageRes>((resolve, reject) => {
                // 응답 리스너 등록
                const handleResponse = (response: rollbackMessageRes) => {
                    // 응답을 받았을 때 store 업데이트
                    if (response.spreadSheetVersionId) {
                        useSpreadSheetVersionStore.getState().setSpreadSheetVersion(response.spreadSheetVersionId);
                    }
                    if (response.editLockVersion !== undefined) {
                        useSpreadSheetVersionStore.getState().setEditLockVersion(response.editLockVersion);
                    }

                    apiConnector.offRollbackMessageResponse(handleResponse);
                    resolve(response);

                    renderBackendData(response.spreadSheetData,spread);
                };

                // 에러 리스너 등록
                const handleError = (error: any) => {
                    apiConnector.offRollbackMessageError(handleError);
                    reject(new Error(error.message || 'Rollback failed'));
                };

                apiConnector.onRollbackMessageResponse(handleResponse);
                apiConnector.onRollbackMessageError(handleError);

                // 요청 전송
                apiConnector.rollbackMessage(request);
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };


    return {
        rollbackMessage,
        isLoading,
        error
    };
};