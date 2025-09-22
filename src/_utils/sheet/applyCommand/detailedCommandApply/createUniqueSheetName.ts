import GC from '@mescius/spread-sheets';

const createUniqueSheetName = ( baseName: string, spread: any ) : string => {
    // 1. 기본 이름이 사용 가능한지 먼저 확인합니다.
    if (!spread.getSheetFromName(baseName)) {
        return baseName;
    }

    // 2. 기본 이름이 이미 존재하면, 숫자를 붙여서 확인을 시작합니다.
    let counter = 1;
    let newSheetName = `${baseName} (${counter})`;

    // 후보 이름이 이미 존재하는 한 카운터를 증가시키며 사용 가능한 이름을 찾습니다.
    while (spread.getSheetFromName(newSheetName)) {
        counter++;
        newSheetName = `${baseName} (${counter})`;
    }

    return newSheetName;
};

export default createUniqueSheetName;