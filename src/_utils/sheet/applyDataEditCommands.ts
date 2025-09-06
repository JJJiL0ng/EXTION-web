// import commandApplyEngine from "./useCommandApplyEngine";

import CommandApplyEngine from '@/_utils/sheet/commandApplyEngine';

import { dataEditChatRes } from "@/_types/ai-chat-api/dataEdit.types";

interface applyDataEditCommandsProps {
    dataEditChatRes: dataEditChatRes;
    spread: any; // 적절한 타입으로 변경
}

// 훅이 아닌 즉시 실행 유틸 함수로 제공 (이름에 'use'를 포함하지 않음)
const applyDataEditCommands = ({ dataEditChatRes, spread }: applyDataEditCommandsProps): boolean => {
    const commandsLength = dataEditChatRes.dataEditCommands.length;
    let isDataEdited = false;

    // 명령어가 한번에 여러개가 와도 대응 (보통의 경우 1개)
    for (let i = 0; i < commandsLength; i++) {
        // command apply engine에 세부 명령어 넣어서 동작 수행
        CommandApplyEngine({ dataEditCommand: dataEditChatRes.dataEditCommands[i], spread });
        isDataEdited = true;
    }

    return isDataEdited;
};

export default applyDataEditCommands;
