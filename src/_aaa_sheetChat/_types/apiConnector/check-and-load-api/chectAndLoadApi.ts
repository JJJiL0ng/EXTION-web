import { previousMessagesContent } from "@/_aaa_sheetChat/_types/store/aiChatStore.types";

export interface CheckAndLoadReq {
  spreadSheetId: string;
  chatId: string;
  userId: string;
  spreadSheetVersionId: string | null;
}

export class CheckAndLoadRes {
  exists: boolean = false;
  fileName: string = '';
  spreadSheetVersionId: string | null = null;
  spreadSheetData?: Record<string, any>;
  chatSessionId?: string | null = null;
  chatHistory?: previousMessagesContent[] | null;
}