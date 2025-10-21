import { editScriptReqDto, editScriptResDto } from "../_sc-type/scMultiturn.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const editMultiturnChatScriptApiConnector = async (dto: editScriptReqDto): Promise<editScriptResDto> => {
    console.log('API Request - URL:', `${BASE_URL}/v2/multiturn-chatting/edit-script`);
    console.log('API Request - DTO:', JSON.stringify(dto, null, 2));
    console.log('API Request - DTO keys:', Object.keys(dto));

    const response = await fetch(`${BASE_URL}/v2/multiturn-chatting/edit-script`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error editing multiturn chat script: ${errorData.message || response.statusText}`);
    }

    const data: editScriptResDto = await response.json();
    return data;
}