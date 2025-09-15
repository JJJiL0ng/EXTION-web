import { previousMessagesContent } from "@/_types/store/aiChatStore.types";
export interface loadChatHistoryReq {
  chatId: string;
  userId: string;
}

export interface loadChatHistoryRes {
  wholeChatHistory: previousMessagesContent[];
}



