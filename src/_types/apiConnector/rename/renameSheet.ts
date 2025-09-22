export interface RenameSheetReq {
    spreadSheetId: string;
    userId: string;
    newFileName: string;
}

export interface RenameSheetRes {
    success: boolean;
}