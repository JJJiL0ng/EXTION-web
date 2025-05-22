// UTF-8 검사 함수
export const isValidUTF8 = (text: string): boolean => {
    try {
        new TextEncoder().encode(text);
        return true;
    } catch {
        return false;
    }
};

// 다양한 인코딩으로 디코딩 시도
export const detectAndDecode = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();

    try {
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(arrayBuffer);
        if (isValidUTF8(decoded)) {
            return decoded;
        }
    } catch {
        console.log('UTF-8 디코딩 실패, 다른 인코딩 시도 중...');
    }

    const encodings = ['euc-kr', 'cp949', 'iso-8859-1', 'windows-1252'];

    for (const encoding of encodings) {
        try {
            const decoded = new TextDecoder(encoding).decode(arrayBuffer);
            if (decoded && decoded.length > 0) {
                return decoded;
            }
        } catch {
            console.log(`${encoding} 디코딩 실패`);
        }
    }

    return new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
};

// 파일 확장자 및 유효성 검사
export const isValidSpreadsheetFile = (file: File): boolean => {
    const validTypes = [
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
};

// 메시지 날짜 포맷팅 함수
export const formatMessageDate = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 확장된 시트 데이터 구조 검증
export const validateExtendedSheetContext = (context: any) => {
    console.log('Extended Sheet Context 검증:', {
        sheetName: context?.sheetName,
        sheetIndex: context?.sheetIndex,
        headers: context?.headers?.length,
        dataRange: context?.dataRange,
        totalSheets: context?.totalSheets,
        sheetList: context?.sheetList?.length
    });

    // 필수 필드 확인
    const requiredFields = ['sheetName', 'headers', 'dataRange'];
    const missingFields = requiredFields.filter(field => !context?.[field]);

    if (missingFields.length > 0) {
        console.error('누락된 필드:', missingFields);
        throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
    }

    // headers 구조 확인
    if (!Array.isArray(context.headers) || context.headers.length === 0) {
        console.error('잘못된 headers 구조:', context.headers);
        throw new Error('headers는 비어있지 않은 배열이어야 합니다.');
    }

    // headers의 각 요소가 올바른 구조인지 확인
    const invalidHeaders = context.headers.filter((h: any) => !h.column || !h.name);
    if (invalidHeaders.length > 0) {
        console.error('잘못된 header 구조:', invalidHeaders);
        throw new Error('각 header는 column과 name 필드를 가져야 합니다.');
    }
    
    // headers의 각 요소가 올바른 타입인지 확인
    const nonStringHeaders = context.headers.filter((h: any) => typeof h.name !== 'string');
    if (nonStringHeaders.length > 0) {
        console.error('잘못된 header 타입:', nonStringHeaders);
        throw new Error('각 header의 name은 문자열 타입이어야 합니다.');
    }
}; 