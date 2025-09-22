import { renameSheetApiConnector } from '@/_ApiConnector/sheet/renameSheetApi';
import { getOrCreateGuestId } from '@/_utils/guestUtils';
import useSpreadsheetIdStore from '@/_store/sheet/spreadSheetIdStore';
import useFileNameStore from '@/_store/sheet/fileNameStore';

export const renameSheet = async (newFileName: string) => {
    try {
        const renameSheetReq = {
            spreadSheetId: useSpreadsheetIdStore.getState().spreadSheetId!,
            userId: getOrCreateGuestId(),
            newFileName,
        };
        console.log('🚀 [renameSheet] 스프레드시트 이름 변경 시작:', renameSheetReq);
        const response = await renameSheetApiConnector(renameSheetReq);

        // API 호출 성공 시 즉시 스토어 업데이트
        if (response && response.success) {
            console.log('✅ [renameSheet] 서버 응답 성공, 스토어 업데이트:', newFileName);
            useFileNameStore.getState().setFileName(newFileName);
        }

        return response;
    } catch (error) {
        console.error('❌ [renameSheet] 스프레드시트 이름 변경 실패:', error);
        throw error;
    }
}