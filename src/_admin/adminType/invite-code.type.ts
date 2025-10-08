export interface createInviteCodeReqType {
    node: string;
    code?: string;
}

export interface createInviteCodeResType {
    success: boolean;
    link: string;
}