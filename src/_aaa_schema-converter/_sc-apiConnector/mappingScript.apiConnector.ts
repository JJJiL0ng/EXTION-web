//apiconnetor 프론트 코드임

import { postJson } from "@/shared/api/httpClient";
import { ScMappingScriptReqDto, ScMappingScriptResDto } from "../_sc-type/scMappingScript.types";

/**
 * 매핑 스크립트 생성 API
 * - WorkflowCode의 mappingSuggestion을 기반으로 AI가 mappingScript JSON 생성
 * - 생성된 mappingScript를 WorkflowCode에 저장
 */
export const createMappingScriptApiConnector = async (dto: ScMappingScriptReqDto): Promise<ScMappingScriptResDto> => {
    console.log('API Request - URL:', '/v2/mapping-script-maker/create');
    console.log('API Request - DTO:', JSON.stringify(dto, null, 2));
    console.log('API Request - DTO keys:', Object.keys(dto));

    const data = await postJson<ScMappingScriptResDto, ScMappingScriptReqDto>('/v2/mapping-script-maker/create', dto, {
        errorMessage: 'Error creating mapping script',
    });
    return data;
}
