// 이건 프론트앤드 코드로 fetch만 하는 역할의 api connector입니다.
import { postJson } from "@/shared/api/httpClient";
import { createInviteCodeReqType, createInviteCodeResType } from "../adminType/invite-code.type";

export async function createInviteCode(
  req: createInviteCodeReqType
): Promise<createInviteCodeResType> {
  return postJson<createInviteCodeResType, createInviteCodeReqType>('/invite-code', req, {
    errorMessage: '초대 코드 생성 실패',
  });
}
