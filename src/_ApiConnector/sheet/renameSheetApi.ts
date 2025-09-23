import { RenameSheetReq, RenameSheetRes } from "@/_types/apiConnector/rename/renameSheet";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const renameSheetApiConnector = async (params: RenameSheetReq): Promise<RenameSheetRes> => {

    const response = await fetch(`${BASE_URL}/v2/table-data-json-save/rename-fileName`, {
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

