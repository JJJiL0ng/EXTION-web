import { CheckAndLoadReq, CheckAndLoadRes } from "@/_types/apiConnector/check-and-load-api/chectAndLoadApi";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const checkAndLoadApiConnector = async (params: CheckAndLoadReq): Promise<CheckAndLoadRes> => {
    const url = new URL(`${BASE_URL}/v2/table-data-json-save/check-and-load`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
        }
    });

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to check and load API: ${response.status} ${errorText}`);
    }
    return response.json();
};