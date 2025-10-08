// 이건 프론트앤드 코드로 fetch만 하는 역할의 api connector입니다.
import { createInviteCodeReqType, createInviteCodeResType } from "../adminType/invite-code.type";

export async function createInviteCode(
  req: createInviteCodeReqType
): Promise<createInviteCodeResType> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invite-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new Error(`초대 코드 생성 실패: ${response.statusText}`);
  }

  return response.json();
}
