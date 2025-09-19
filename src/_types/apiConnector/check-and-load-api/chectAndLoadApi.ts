import { previousMessagesContent } from "@/_types/store/aiChatStore.types";

export interface CheckAndLoadReq {
  spreadSheetId: string;
  chatId: string;
  userId: string;
  spreadSheetVersionId: string | null;
}

export class CheckAndLoadRes {
  exists: boolean = false;
  spreadSheetVersionId: string | null = null;
  spreadSheetData?: Record<string, any>;
  chatHistory?: previousMessagesContent[] | null;
}