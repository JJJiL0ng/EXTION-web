import { getApiErrorMessage } from "@/shared/api/apiError";
import { postJson } from "@/shared/api/httpClient";
import { verifyReqType, verifyResType } from "../_type/verify-invite.type";

export const verifyInviteCode = async (
  inviteCode: string
): Promise<verifyResType> => {
  const requestBody: verifyReqType = { inviteCode };

  console.log('🔍 [API Call] verify-invite:', {
    path: '/auth/verify-invite',
    method: 'POST',
    body: requestBody,
  });

  try {
    const data = await postJson<verifyResType, verifyReqType>('/auth/verify-invite', requestBody, {
      errorMessage: '초대 코드 검증 실패',
    });
    console.log('✅ [API Success]:', data);
    return data;
  } catch (error) {
    console.error('💥 [API Exception]:', error);
    const message = getApiErrorMessage(error);
    if (message) {
      throw new Error(message);
    }
    throw error;
  }
};
