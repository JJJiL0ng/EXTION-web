import { previousMessagesContent } from "@/_types/store/aiChatStore.types";

export interface CheckAndLoadReq {
  spreadSheetId: string;
  chatId: string;
  userId: string;
}

export class CheckAndLoadRes {
  exists: boolean = false;
  latestVersion?: number | null;
  spreadSheetData?: Record<string, any>;
  chatHistory?: previousMessagesContent[] | null;
}