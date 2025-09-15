export interface loadChatHistoryReq {
  chatId: string;
  userId: string;
}

export interface loadChatHistoryRes {
  wholeChatHistory: previousMessagesContent[];
}

export interface previousMessagesContent {
    role: 'user' | 'assistant';
    content: string;
}

