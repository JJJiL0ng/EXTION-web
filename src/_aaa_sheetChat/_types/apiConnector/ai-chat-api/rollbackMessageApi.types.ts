export interface rollbackMessageReq {
  spreadSheetId: string;
  chatId: string;
  userId: string;
  chatSessionId: string;
  chatSessionBranchId: string; // 롤백으로 대상 메시지의 chatSessionBranchId
}

export interface rollbackMessageRes {
  parentChatSessionBranchId: string; // 롤백 후 새로 메시지를 보낼때 다시 프론트에서 전달해줘야하는 프로퍼티
  spreadSheetVersionId: string; // 새로 생성된 버전 ID 
  editLockVersion: number; // 낙관적 잠금을 위한 버전 번호
  spreadSheetData: Record<string, any>; // 롤백 대상 메시지를 보내기전으로 스프레드시트 데이터 롤백
}
