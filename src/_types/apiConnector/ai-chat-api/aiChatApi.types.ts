import { dataEditChatRes } from "./dataEdit.types";
import { TaskManagerOutput } from "./task.types";


export interface aiChatApiReq {
    websocketClientId?: string; // 소켓 연결을 위한 클라이언트 ID
    spreadsheetId: string;
    chatId: string;
    chatSessionId: string; // 특정 채팅 세션을 구분하기 위한 ID (새로운 대화 시작시마다 변경)
    userId: string;
    chatMode: 'agent' | 'edit';
    userQuestionMessage: string;
    parsedSheetNames: string[];
    jobId: string;
    spreadSheetVersionId: string | null; // Optional: 특정 버전 ID (없을 시 최신 버전 사용)
    newVersionSpreadSheetData?: Record<string, any>; // Optional: 새 버전의 데이터(변경사항이 있을시에만 프론트에서 보내줄 예정)
    editLockVersion?: number; // Optional: 낙관적 잠금을 위한 버전 번호 (없을 시 최신 버전 사용)

}
export interface aiChatApiRes {
    jobId: string;
    chatSessionId: string; // 응답에 chatSessionId 포함
    taskManagerOutput: TaskManagerOutput;
    dataEditChatRes: dataEditChatRes;
    spreadSheetVersionId: string;
    editLockVersion: number; // Optional: 낙관적 잠금을 위한 버전 번호 (없을 시 최신 버전 사용)
}


