import { useState } from 'react';
import { verifyInviteCode } from "../_apiConnector/verify-invite.apiConnector";
import { verifyResType } from '../_type/verify-invite.type';

export const useVerifyInviteCode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<verifyResType | null>(null);

  const verify = async (inviteCode: string): Promise<verifyResType | null> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await verifyInviteCode(inviteCode);
      setData(result);
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

