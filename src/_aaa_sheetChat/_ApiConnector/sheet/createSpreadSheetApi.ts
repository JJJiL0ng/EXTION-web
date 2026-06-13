import { CreateSpreadSheetReq, CreateSpreadSheetRes } from '@/_aaa_sheetChat/_types/apiConnector/spreadsheet-create/spreadSheetCreateApi';
import { postJson } from '@/shared/api/httpClient';

export const createSpreadSheetApiConnector = async (params: CreateSpreadSheetReq): Promise<CreateSpreadSheetRes> => {
    console.log('🔗 [CreateSpreadSheetAPI] API 호출 시작:', { params });
    const responseData = await postJson<CreateSpreadSheetRes, CreateSpreadSheetReq>('/v2/table-data-json-save/create', params, {
        errorMessage: 'Failed to create spreadsheet',
    });
    console.log('✅ [CreateSpreadSheetAPI] 응답 데이터:', {
        response: responseData
    });
    return responseData;
};
