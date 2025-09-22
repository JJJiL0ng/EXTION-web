import { dataEditChatRes } from "./dataEdit.types";
import { TaskManagerOutput } from "./task.types";


export interface aiChatApiReq {
    websocketClientId?: string; // 소켓 연결을 위한 클라이언트 ID
    spreadsheetId: string;
    chatId: string;
    chatSessionId: string | null; // 특정 채팅 세션을 구분하기 위한 ID (새로운 대화 시작시마다 변경)
    userChatSessionBranchId: string ; // 프론트에서 생성해서 유저 채팅 상태에 저장해두고 롤백 시에 사용될거임, 프론트에서 이걸 message의 id로 사용함
    userId: string;
    chatMode: 'agent' | 'edit';
    userQuestionMessage: string;
    parsedSheetNames: string[];
    jobId: string;
    spreadSheetVersionId: string | null; // Optional: 특정 버전 ID (없을 시 최신 버전 사용)
    newVersionSpreadSheetData?: Record<string, any>; // Optional: 새 버전의 데이터(변경사항이 있을시에만 프론트에서 보내줄 예정)
    editLockVersion: number | null; // Optional: 낙관적 잠금을 위한 버전 번호 (없을 시 최신 버전 사용)
    parentChatBranchId?: string; // Optional: 대화 분기 시에 부모 브랜치 ID (없을 시 null)
}
export interface aiChatApiRes {
    jobId: string;
    chatSessionId: string; // 응답에 chatSessionId 포함
    taskManagerOutput: TaskManagerOutput;
    dataEditChatRes: dataEditChatRes;
    spreadSheetVersionId: string;
    editLockVersion: number; // Optional: 낙관적 잠금을 위한 버전 번호 (없을 시 최신 버전 사용)
}


