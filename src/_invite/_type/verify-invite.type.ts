
export interface verifyReqType {
    inviteCode: string;
}

export interface verifyResType {
    success: boolean;
    userId: string;
    isFirstTime: boolean;
}

