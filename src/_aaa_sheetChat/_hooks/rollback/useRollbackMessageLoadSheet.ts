import { rollbackMessageReq, rollbackMessageRes } from "@/_aaa_sheetChat/_types/apiConnector/ai-chat-api/rollbackMessageApi.types";
import { useAiChatApiConnector } from "@/_aaa_sheetChat/_hooks/aiChat/useAiChatApiConnector";
import { useState } from "react";
import { useSpreadSheetVersionStore } from "@/_aaa_sheetChat/_store/sheet/spreadSheetVersionIdStore";
import { useSheetRender } from "@/_aaa_sheetChat/_hooks/sheet/spreadjs/useSheetRender";
import { useSpreadsheetContext } from "@/_aaa_sheetChat/_contexts/SpreadsheetContext";

export const useRollbackMessageLoadSheet = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { spread } = useSpreadsheetContext();
    const { rollbackMessage: apiRollbackMessage, isConnected } = useAiChatApiConnector();

    const { renderBackendData } = useSheetRender({
        onSuccess: (fileName) => {
            console.log('✅ [useRollbackMessageLoadSheet] 스프레드시트 렌더링 성공:', fileName);
        },
        onError: (error, fileName) => {
            console.error('❌ [useRollbackMessageLoadSheet] 백엔드 데이터 렌더링 실패:', { error, fileName });
        }
    });

    const rollbackMessage = async (request: rollbackMessageReq): Promise<rollbackMessageRes | null> => {
        console.log('📤 [useRollbackMessageLoadSheet] 롤백 요청 시작:', request);

        if (!isConnected) {
            const errorMsg = 'API connector is not connected';
            console.error('❌ [useRollbackMessageLoadSheet]', errorMsg);
            setError(errorMsg);
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('⏳ [useRollbackMessageLoadSheet] API 호출 중...');
            const response = await apiRollbackMessage(request);
            console.log('📥 [useRollbackMessageLoadSheet] API 응답 받음:', response);

            // 응답을 받았을 때 store 업데이트
            if (response.spreadSheetVersionId) {
                useSpreadSheetVersionStore.getState().setSpreadSheetVersion(response.spreadSheetVersionId);
            }
            if (response.editLockVersion !== undefined) {
                useSpreadSheetVersionStore.getState().setEditLockVersion(response.editLockVersion);
            }

            renderBackendData(response.spreadSheetData, spread);

            return response;
        } catch (err) {
            console.error('❌ [useRollbackMessageLoadSheet] 에러 발생:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            console.error('❌ [useRollbackMessageLoadSheet] 에러 메시지:', errorMessage);
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