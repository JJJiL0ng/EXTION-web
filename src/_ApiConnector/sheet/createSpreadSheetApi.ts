export interface CreateSpreadSheetReq{
  fileName: string;
  spreadsheetId: string;
  chatId: string;
  userId: string;
  jsonData: Record<string, any>;
}

export interface CreateSpreadSheetRes {
  success: boolean;
  message: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const createSpreadSheetApiConnector = async (params: CreateSpreadSheetReq): Promise<CreateSpreadSheetRes> => {
    console.log('🔗 [CreateSpreadSheetAPI] API 호출 시작:', { BASE_URL, params });

    const response = await fetch(`${BASE_URL}/v2/table-data-json-save/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to create spreadsheet: ${response.status} ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('✅ [CreateSpreadSheetAPI] 응답 데이터:', {
        response: responseData
    });
    return responseData;
};

