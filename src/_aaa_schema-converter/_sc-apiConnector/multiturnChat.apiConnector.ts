import { postJson } from "@/shared/api/httpClient";
import { editScriptReqDto, editScriptResDto } from "../_sc-type/scMultiturn.types";

export const editMultiturnChatScriptApiConnector = async (dto: editScriptReqDto): Promise<editScriptResDto> => {
    console.log('API Request - URL:', '/v2/multiturn-chatting/edit-script');
    console.log('API Request - DTO:', JSON.stringify(dto, null, 2));
    console.log('API Request - DTO keys:', Object.keys(dto));

    const data = await postJson<editScriptResDto, editScriptReqDto>('/v2/multiturn-chatting/edit-script', dto, {
        errorMessage: 'Error editing multiturn chat script',
    });
    return data;
}
