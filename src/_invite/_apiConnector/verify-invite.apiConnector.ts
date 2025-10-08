import { verifyReqType, verifyResType } from "../_type/verify-invite.type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const verifyInviteCode = async (
  inviteCode: string
): Promise<verifyResType> => {
  const requestBody: verifyReqType = { inviteCode };
  const url = `${API_BASE_URL}/auth/verify-invite`;

  console.log('🔍 [API Call] verify-invite:', {
    url,
    method: 'POST',
    body: requestBody,
    apiBaseUrl: API_BASE_URL,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 [API Response]:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "유효하지 않은 초대 코드입니다.",
      }));
      console.error('❌ [API Error]:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: verifyResType = await response.json();
    console.log('✅ [API Success]:', data);
    return data;
  } catch (error) {
    console.error('💥 [API Exception]:', error);
    throw error;
  }
};
