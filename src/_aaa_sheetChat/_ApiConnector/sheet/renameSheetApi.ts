import { RenameSheetReq, RenameSheetRes } from "@/_aaa_sheetChat/_types/apiConnector/rename/renameSheet";
import { postJson } from "@/shared/api/httpClient";

export const renameSheetApiConnector = async (params: RenameSheetReq): Promise<RenameSheetRes> => {

    const responseData = await postJson<RenameSheetRes, RenameSheetReq>('/v2/table-data-json-save/rename-fileName', params, {
        errorMessage: 'Failed to rename spreadsheet',
    });
    console.log('✅ [RenameSheetAPI] 응답 데이터:', {
        response: responseData
    });
    return responseData;
};
