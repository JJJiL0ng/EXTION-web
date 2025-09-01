import { useState } from 'react';
import commandApplyEngine from "./useCommandApplyEngine";

import { dataEditChatRes } from "@/_Api/ai-chat/aiChatApi.types";

interface useDataEditApplyProps {
    dataEditChatRes: dataEditChatRes;
}

interface useDataEditApplyReturns {
    isDataEdited: boolean;
}

const useDataEditApply = ({ dataEditChatRes }: useDataEditApplyProps): useDataEditApplyReturns => {
    const [isDataEdited, setIsDataEdited] = useState(false);


    const commandsLength = dataEditChatRes.dataEditCommands.length;


    // 명령어가 한번에 여러개가 와도 대응 보통의 경우 1개
    for (let i = 0; i < commandsLength; i++) {
        //command apply engine에 세부 명령어 넣어서 동작 수행
        commandApplyEngine({dataEditCommand: dataEditChatRes.dataEditCommands[i]});

        setIsDataEdited(true);
    }


    // console.log('Generated command:', madeCommands);

    return { isDataEdited };
};

export default useDataEditApply;
