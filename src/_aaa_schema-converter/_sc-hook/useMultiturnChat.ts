import { editScriptResDto, editScriptReqDto } from "../_sc-type/scMultiturn.types";
import { useScWorkflowStore } from "../_sc-store/scWorkflowStore";
import { editMultiturnChatScriptApiConnector } from "../_sc-apiConnector/multiturnChat.apiConnector";
import { useScChattingStore } from "../_sc-store/scChattingStore";

export interface SendMultiturnChatProps {
    userMessage: string;
}

// 일반 함수로 변경 (훅이 아님)
export const sendMultiturnChat = async ({ userMessage }: SendMultiturnChatProps) => {
    // getState()를 사용하여 스토어에서 값을 가져옴
    const { workFlowId, workflowCodeId, sourceSheetVersionId, targetSheetVersionId, setWorkflowCodeId } = useScWorkflowStore.getState();
    const { addMessage } = useScChattingStore.getState();
    
    const inputData: editScriptReqDto = {
        message: userMessage,
        workFlowId: workFlowId,
        workFlowCodeId: workflowCodeId,
        sourceSheetVersionId: sourceSheetVersionId,
        targetSheetVersionId: targetSheetVersionId,
    };
    
    const response = await editMultiturnChatScriptApiConnector(inputData);
    console.log("Multiturn chat response:", response);
    if (response.workFlowCodeId) {
        setWorkflowCodeId(response.workFlowCodeId);
    }
    // mappingSuggestion이 존재하면 (빈 문자열도 포함) 메시지 추가
    if (response.mappingSuggestion !== undefined && response.mappingSuggestion !== null) {
        addMessage({ // 매핑 제안 메시지 추가
            role: 'assistant',
            contentType: 'mapping-suggestion',
            content: response.mappingSuggestion // 서버에서 이미 포맷된 마크다운으로 받음
        });
    }
    
    return response;
};