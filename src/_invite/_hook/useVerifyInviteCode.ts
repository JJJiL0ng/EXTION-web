import { useState } from 'react';
import { verifyInviteCode } from "../_apiConnector/verify-invite.apiConnector";
import { verifyResType } from '../_type/verify-invite.type';
import useUserIdStore from '@/_aaa_sheetChat/_aa_superRefactor/store/user/userIdStore';

export const useVerifyInviteCode = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<verifyResType | null>(null);
    const { setUserId } = useUserIdStore();
    const verify = async (inviteCode: string): Promise<verifyResType | null> => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const result = await verifyInviteCode(inviteCode);
            setData(result);
            if (result.userId) {
                setUserId(result.userId);
            }
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '초대 코드 확인에 실패했습니다';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        verify,
        isLoading,
        error,
        data,
    };
};

