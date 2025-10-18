//apiconnetor 프론트 코드임

import { ScMappingScriptReqDto, ScMappingScriptResDto } from "../_sc-type/scMappingScript.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * 매핑 스크립트 생성 API
 * - WorkflowCode의 mappingSuggestion을 기반으로 AI가 mappingScript JSON 생성
 * - 생성된 mappingScript를 WorkflowCode에 저장
 */
export const createMappingScriptApiConnector = async (dto: ScMappingScriptReqDto): Promise<ScMappingScriptResDto> => {
    console.log('API Request - URL:', `${BASE_URL}/v2/mapping-script-maker/create`);
    console.log('API Request - DTO:', JSON.stringify(dto, null, 2));
    console.log('API Request - DTO keys:', Object.keys(dto));

    const response = await fetch(`${BASE_URL}/v2/mapping-script-maker/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error creating mapping script: ${errorData.message || response.statusText}`);
    }

    const data: ScMappingScriptResDto = await response.json();
    return data;
}