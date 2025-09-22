export interface CreateSpreadSheetReq{
  fileName: string;
  spreadsheetId: string;
  chatId: string;
  userId: string;
  jsonData: Record<string, any>;
}

export interface CreateSpreadSheetRes {
  success: boolean;
  message: string;
  spreadSheetVersionId: string;
}