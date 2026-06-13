import { CheckAndLoadReq, CheckAndLoadRes } from "@/_aaa_sheetChat/_types/apiConnector/check-and-load-api/chectAndLoadApi";
import { getJson } from "@/shared/api/httpClient";

export const checkAndLoadApiConnector = async (params: CheckAndLoadReq): Promise<CheckAndLoadRes> => {
    console.log('🔗 [CheckAndLoadAPI] API 호출 시작:', { params });
    const responseData = await getJson<CheckAndLoadRes>('/v2/table-data-json-save/check-and-load', {
        query: { ...params },
        errorMessage: 'Failed to check and load API',
    });
    console.log('✅ [CheckAndLoadAPI] 응답 데이터:', {
        response: responseData
    });
    return responseData;
};
