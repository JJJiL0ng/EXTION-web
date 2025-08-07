data: {
    "success": true,
    "tokensUsed": 0,
    "responseTime": 13335,
    "model": "claude",
    "cached": false,
    "confidence": 0.95,
    "analysis": {
        "detectedOperation": "F2:F51 범위의 단가 데이터 총합 계산",
        "dataRange": "F2:F51",
        "targetCells": "F52",
        "operationType": "single_cell"
    },
    "formulaDetails": {
        "name": "SUM",
        "description": "F2부터 F51까지의 모든 단가 값을 합산",
        "syntax": "=SUM(F2:F51)",
        "parameters": [
            {
                "name": "range",
                "description": "합계를 계산할 셀 범위",
                "required": true,
                "example": "F2:F51"
            }
        ],
        "spreadjsCommand": "worksheet.setFormula(52, 5, '=SUM(F2:F51)', GC.Spread.Sheets.SheetArea.viewport);"
    },
    "implementation": {
        "steps": [
            "1단계: F2:F51 범위의 단가 데이터 확인",
            "2단계: SUM 함수로 총합 계산",
            "3단계: 결과를 F52 셀에 표시"
        ],
        "cellLocations": {
            "source": "F2:F51",
            "target": "F52",
            "description": "F2:F51 범위의 단가 데이터 총합 계산"
        }
    },
    "chatId": "1b61c21f-8295-40ae-b5d0-ee2d12acaadd",
    "timestamp": "2025-08-07T04:13:23.628Z"
    }


========================


    data: {
    "success": true,
    "tokensUsed": 0,
    "responseTime": 20217,
    "model": "claude",
    "cached": false,
    "confidence": 0.95,
    "analysis": {
        "detectedOperation": "F열(단가) 기준 내림차순 정렬",
        "dataRange": "A1:G51",
        "targetCells": "A1:G51",
        "operationType": "range_operation"
    },
    "formulaDetails": {
        "name": "sortRange",
        "description": "단가(F열)를 기준으로 데이터를 내림차순으로 정렬",
        "syntax": "worksheet.sortRange(startRow, startCol, rowCount, colCount, byRows, sortInfo)",
        "parameters": [
            {
                "name": "startRow",
                "description": "정렬 시작 행",
                "required": true,
                "example": 1
            },
            {
                "name": "startCol",
                "description": "정렬 시작 열",
                "required": true,
                "example": 0
            },
            {
                "name": "rowCount",
                "description": "정렬할 총 행 수",
                "required": true,
                "example": 51
            },
            {
                "name": "colCount",
                "description": "정렬할 총 열 수",
                "required": true,
                "example": 7
            },
            {
                "name": "byRows",
                "description": "행 기준 정렬 여부",
                "required": true,
                "example": true
            },
            {
                "name": "sortInfo",
                "description": "정렬 기준 열과 방향",
                "required": true,
                "example": "[{index: 5, ascending: false}]"
            }
        ],
        "spreadjsCommand": "worksheet.sortRange(1, 0, 51, 7, true, [{index: 5, ascending: false}]);"
    },
    "implementation": {
        "steps": [
            "1단계: 데이터 범위 확인 (A1:G51)",
            "2단계: F열(index 5) 기준 내림차순 정렬 실행",
            "3단계: 정렬 결과 검증"
        ],
        "cellLocations": {
            "source": "A1:G51",
            "target": "A1:G51",
            "description": "F열(단가) 기준 내림차순 정렬"
        }
    },
    "chatId": "1b61c21f-8295-40ae-b5d0-ee2d12acaadd",
    "timestamp": "2025-08-07T04:23:26.397Z"
    }


====================


    data: {
    "success": true,
    "tokensUsed": 0,
    "responseTime": 21056,
    "model": "claude",
    "cached": false,
    "confidence": 0.95,
    "analysis": {
        "detectedOperation": "단가(F열) 평균 계산 후 평균 이상 데이터 필터링",
        "dataRange": "F2:F51",
        "targetCells": "A2:G51",
        "operationType": "range_operation"
    },
    "formulaDetails": {
        "name": "Filter & Average",
        "description": "F열 단가의 평균을 계산하고, 평균 이상인 행만 표시",
        "syntax": "=AVERAGEIF(F2:F51, '>AVERAGE(F2:F51)')",
        "parameters": [
            {
                "name": "범위",
                "description": "평균 계산 대상 범위",
                "required": true,
                "example": "F2:F51"
            }
        ],
        "spreadjsCommand": "worksheet.rowFilter(new GC.Spread.Sheets.Filter.HideRowFilter(new GC.Spread.Sheets.Range(1, 0, 50, 7)))"
    },
    "implementation": {
        "steps": [
            "1. F열 단가의 평균 계산",
            "2. 평균 이상인 행 필터링",
            "3. 필터링된 행만 표시"
        ],
        "cellLocations": {
            "source": "F2:F51",
            "target": "A2:G51",
            "description": "단가 평균 이상인 행 필터링"
        }
    },
    "chatId": "1b61c21f-8295-40ae-b5d0-ee2d12acaadd",
    "timestamp": "2025-08-07T05:35:27.976Z"
    }