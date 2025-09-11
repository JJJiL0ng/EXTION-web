// import commandApplyEngine from "./useCommandApplyEngine";

import CommandApplyEngine from '@/_utils/sheet/commandApplyEngine';
import { dataEditCommand } from '@/_types/ai-chat-api/dataEdit.types';
import { dataEditChatRes } from "@/_types/ai-chat-api/dataEdit.types";

interface applyDataEditCommandsProps {
    dataEditChatRes: dataEditChatRes;
    spread: any; // 적절한 타입으로 변경
}

// 훅이 아닌 즉시 실행 유틸 함수로 제공 (이름에 'use'를 포함하지 않음)
const applyDataEditCommands = ({ dataEditChatRes, spread }: applyDataEditCommandsProps): boolean => {
    console.log('🚀 [applyDataEditCommands] Full dataEditChatRes:', dataEditChatRes);
    console.log('🚀 [applyDataEditCommands] Commands count:', dataEditChatRes.dataEditCommands.length);
    
    const commandsLength = dataEditChatRes.dataEditCommands.length;
    let isDataEdited = false;

    // 명령어가 한번에 여러개가 와도 대응 (보통의 경우 1개)
    for (let i = 0; i < commandsLength; i++) {
        const command = dataEditChatRes.dataEditCommands[i];
        console.log('🚀 [applyDataEditCommands] Processing command[' + i + ']:', command);
        
        // 중복 래핑된 구조 처리
        if (command.dataEditCommands && Array.isArray(command.dataEditCommands)) {
            // 중첩된 배열의 모든 명령어 처리
            const nestedCommands = command.dataEditCommands;
            console.log('🚀 [applyDataEditCommands] Found nested commands, count:', nestedCommands.length);
            
            for (let j = 0; j < nestedCommands.length; j++) {
                const actualCommand: dataEditCommand = nestedCommands[j];
                console.log('🚀 [applyDataEditCommands] Processing nested command[' + j + ']:', actualCommand);
                
                // command apply engine에 세부 명령어 넣어서 동작 수행
                CommandApplyEngine({ dataEditCommand: actualCommand, spread });
                isDataEdited = true;
            }
        } else {
            // 일반적인 단일 명령어 처리
            console.log('🚀 [applyDataEditCommands] Processing direct command:', command);
            CommandApplyEngine({ dataEditCommand: command as dataEditCommand, spread });
            isDataEdited = true;
        }
    }

    return isDataEdited;
};

export default applyDataEditCommands;
