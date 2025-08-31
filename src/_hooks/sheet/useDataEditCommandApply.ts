import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";
import { useState } from 'react';
import useCommandMaker from "./useCommandMaker";

interface useDataEditApplyProps {
    sheetIndex: number;
    dataEditCommand: string;
    range: string;
}

interface useDataEditApplyReturns {
    isDataEdited: boolean;
}

const useDataEditApply = ({ dataEditCommand, sheetIndex, range }: useDataEditApplyProps): useDataEditApplyReturns => {
    const { spread } = useSpreadsheetContext();
    const [isDataEdited] = useState(false);

    spread.setActiveSheet(sheetIndex);

    // useCommandMaker의 현재 시그니처에 맞게 호출하여 문자열 명령 생성
    const { makeCommand } = useCommandMaker({ dataEditCommand, range });
    console.log('Generated command:', makeCommand);

    return { isDataEdited };
};

export default useDataEditApply;
