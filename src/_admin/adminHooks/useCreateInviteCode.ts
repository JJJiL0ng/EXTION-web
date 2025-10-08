import { useState } from 'react';
import { createInviteCode } from "../adminApiConnector/createInviteCode";
import { createInviteCodeReqType, createInviteCodeResType } from "../adminType/invite-code.type";

export const useCreateInviteCode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCode = async (req: createInviteCodeReqType): Promise<createInviteCodeResType | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createInviteCode(req);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '초대 코드 생성에 실패했습니다';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCode,
    isLoading,
    error,
  };
};
