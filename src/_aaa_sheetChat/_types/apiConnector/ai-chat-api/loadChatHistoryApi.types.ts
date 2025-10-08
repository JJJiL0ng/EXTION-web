import { previousMessagesContent } from "@/_aaa_sheetChat/_types/store/aiChatStore.types";
export interface loadChatHistoryReq {
  chatId: string;
  userId: string;
}

export interface loadChatHistoryRes {
  wholeChatHistory: previousMessagesContent[];
}



