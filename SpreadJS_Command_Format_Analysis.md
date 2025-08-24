# SpreadJS 명령어 형식 분석 및 MainSpreadsheet 적용 가이드

## 📋 개요

현재 시스템에서 백엔드 AI 응답이 MainSpreadsheet(SpreadJS)에 적용되기까지의 명령어 형식과 처리 과정을 상세히 분석한 문서입니다.

## 🔄 현재 아키텍처 분석

### 1. 데이터 흐름 구조
```
백엔드 응답 → enrichment → FormulaMessage → FormulaTransformer → SpreadsheetContext → CommandEngine → SpreadJS
```

### 2. 핵심 타입 정의

#### 2.1 백엔드 응답 형식 (NewChatResponseData)
```typescript
interface NewChatResponseData {
  success: boolean;
  
  // Excel Formula 관련 핵심 데이터
  formulaDetails?: {
    name: string;                    // 예: "SUM", "VLOOKUP"
    description: string;             // 수식 설명
    syntax: string;                 // 예: "=SUM(A1:B10)"
    spreadjsCommand: string;        // 🔑 핵심! 실행할 SpreadJS 명령어
  };
  
  analysis?: {
    detectedOperation: string;       // 예: "합계 계산"
    dataRange?: string;             // 예: "A1:B10"
    targetCells?: string;           // 예: "C1"
    operationType?: 'single_cell' | 'multiple_cells' | 'range_operation';
  };
  
  implementation?: {
    steps: string[];                // 실행 단계 설명
    cellLocations: {
      source: string;               // 소스 범위
      target: string;               // 대상 셀
      description: string;          // 작업 설명
    };
  };
}
```

#### 2.2 내부 처리 형식 (FormulaResponse)
```typescript
interface FormulaResponse {
  success: boolean;
  analysis: {
    detectedOperation: string;
    dataRange: string;
    targetCells: string;
    operationType: string;
  };
  formulaDetails: {
    name: string;
    description: string;
    syntax: string;
    spreadjsCommand: string;        // 🔑 실제 실행될 JavaScript 명령어
  };
  implementation: {
    steps: string[];
    cellLocations: {
      source: string;
      target: string;  
      description: string;
    };
  };
}
```

## 🎯 현재 지원하는 명령어 형식

### 3.1 JavaScript 명령어 통일 방식

**⚠️ 중요**: 현재 시스템은 모든 명령어를 **JavaScript 형식으로 통일**하여 처리합니다.

```typescript
// useSpreadjsCommandEngine.ts - 160행
const identifyCommandType = useCallback((command: string): string => {
  return 'javascript';  // 모든 명령어를 JavaScript로 통일
}, []);
```

### 3.2 실행 가능한 명령어 형식

#### A. 기본 셀 값 설정
```javascript
// 형식: worksheet.setValue(행인덱스, 열인덱스, 값)
worksheet.setValue(0, 0, "Hello World");
worksheet.setValue(1, 2, 123);
worksheet.setValue(2, 3, new Date());
```

#### B. 수식 설정
```javascript  
// 형식: worksheet.setFormula(행인덱스, 열인덱스, '수식')
worksheet.setFormula(0, 2, '=SUM(A1:B10)');
worksheet.setFormula(1, 3, '=AVERAGE(A1:A10)');
worksheet.setFormula(2, 4, '=VLOOKUP(A2,C:D,2,FALSE)');
```

#### C. 스타일 적용
```javascript
// 셀 스타일 설정
var style = new GC.Spread.Sheets.Style();
style.backColor = "#FFFF00";
style.foreColor = "#FF0000";
worksheet.setStyle(0, 0, style);
```

#### D. 범위 작업
```javascript
// 범위 선택 및 설정
worksheet.setArray(0, 0, [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
worksheet.setValue(0, 0, "=SUM(A1:C3)", GC.Spread.Sheets.SheetArea.viewport);
```

### 3.3 좌표 체계

**SpreadJS는 0-based 인덱스를 사용합니다:**
- A1 = (0, 0)
- B1 = (0, 1)  
- A2 = (1, 0)
- C3 = (2, 2)

## 🔧 명령어 실행 엔진 분석

### 4.1 실행 프로세스

```typescript
// useSpreadjsCommandEngine.ts - executeJavaScriptCommand 함수
const executeJavaScriptCommand = useCallback((command: string, worksheet: any, spread: any) => {
  try {
    // 1. 명령어 정제 (세미콜론 추가)
    let processedCommand = command;
    if (!processedCommand.endsWith(';')) {
      processedCommand += ';';
    }
    
    // 2. 안전한 실행 컨텍스트 생성
    const executeInContext = new Function(
      'worksheet', 
      'spread', 
      'GC',
      `"use strict"; ${processedCommand}`
    );
    
    // 3. 명령어 실행
    executeInContext(worksheet, spread, GC);
    
  } catch (error) {
    throw new Error(`JavaScript 명령어 실행 실패: ${error.message}`);
  }
}, []);
```

### 4.2 보안 검증

```typescript
// validateCommand 함수에서 위험한 명령어 차단
const dangerousPatterns = [
  'clearAll',
  'deleteSheet', 
  'removeSheet',
  'destroy'
];

if (dangerousPatterns.some(pattern => command.includes(pattern))) {
  throw new Error('위험한 명령어가 감지되었습니다.');
}
```

## 📝 백엔드에서 전달해야 할 명령어 형식

### 5.1 권장 명령어 패턴

#### A. 단일 셀 값 설정
```json
{
  "formulaDetails": {
    "spreadjsCommand": "worksheet.setValue(0, 2, '결과값');"
  }
}
```

#### B. 수식 적용
```json
{
  "formulaDetails": {
    "spreadjsCommand": "worksheet.setFormula(0, 2, '=SUM(A1:B10)');"
  }
}
```

#### C. 복합 작업
```json
{
  "formulaDetails": {
    "spreadjsCommand": "worksheet.setValue(0, 0, '제목'); worksheet.setFormula(0, 1, '=A1*2'); worksheet.setValue(0, 2, '완료');"
  }
}
```

### 5.2 좌표 변환 유틸리티

현재 시스템에는 A1 형식을 인덱스로 변환하는 함수가 있습니다:

```typescript
// parseCellRange 함수 (useSpreadjsCommandEngine.ts - 166행)
const parseCellRange = useCallback((range: string) => {
  // A1:B10 형식 파싱
  const rangeMatch = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
  if (rangeMatch) {
    const [, startCol, startRow, endCol, endRow] = rangeMatch;
    return {
      startRow: parseInt(startRow) - 1,    // 1-based → 0-based
      startCol: startCol.charCodeAt(0) - 65, // A=0, B=1, ...
      endRow: parseInt(endRow) - 1,
      endCol: endCol.charCodeAt(0) - 65
    };
  }
  // ... 단일 셀 처리
}, []);
```

## 🎨 UI 통합 분석

### 6.1 FormulaMessage 컴포넌트

```typescript
// 수식 적용 버튼 클릭 시 실행되는 로직
const handleApplyFormula = useCallback(async () => {
  // 1. 스프레드시트 준비 상태 확인
  if (!spreadsheetContext?.isReady) {
    setExecutionError('스프레드시트가 준비되지 않았습니다.');
    return;
  }
  
  // 2. 데이터 검증
  if (!isValidFormulaContent(message.structuredContent)) {
    setExecutionError('유효하지 않은 수식 데이터입니다.');
    return;
  }
  
  // 3. 변환 및 실행
  const formulaResponse = transformStructuredContentToFormulaResponse(
    message.structuredContent
  );
  
  await spreadsheetContext.executeFormula(formulaResponse);
  setIsApplied(true);
  
}, [spreadsheetContext, message.structuredContent]);
```

### 6.2 자동 실행 모드

**Agent 모드**에서는 사용자 승인 없이 자동으로 수식이 적용됩니다:

```typescript
useEffect(() => {
  if (
    mode === 'agent' && 
    message.status === 'completed' && 
    !isApplied && 
    spreadsheetContext?.isReady &&
    message?.structuredContent?.intent === "excel_formula"
  ) {
    handleApplyFormula(); // 자동 실행
  }
}, [mode, message.status, isApplied, spreadsheetContext?.isReady]);
```

## ⚡ 성능 최적화 요소

### 7.1 렌더링 최적화

```typescript
// 페인팅 일시 중단으로 성능 향상
worksheet.suspendPaint();

try {
  // 여러 명령어 실행
  executeJavaScriptCommand(command, worksheet, spreadRef.current);
} finally {
  // 페인팅 재개
  worksheet.resumePaint();
}
```

### 7.2 실행 히스토리 관리

```typescript
interface ExecutionResult {
  success: boolean;
  commandType: string;
  targetRange: string;
  error?: string;
  executedAt: string;
}

// 실행 기록이 자동으로 저장되어 추후 분석 및 디버깅에 활용
```

## 🚀 백엔드 개발자를 위한 실무 가이드

### 8.1 기본 명령어 템플릿

```json
{
  "success": true,
  "formulaDetails": {
    "name": "사용자요청작업",
    "description": "작업 설명",
    "syntax": "=SUM(A1:B10)",
    "spreadjsCommand": "worksheet.setFormula(0, 2, '=SUM(A1:B10)');"
  },
  "analysis": {
    "detectedOperation": "합계 계산",
    "dataRange": "A1:B10", 
    "targetCells": "C1",
    "operationType": "range_operation"
  },
  "implementation": {
    "steps": ["범위 A1:B10 선택", "SUM 수식 적용", "결과를 C1에 출력"],
    "cellLocations": {
      "source": "A1:B10",
      "target": "C1",
      "description": "합계 결과 출력"
    }
  }
}
```

### 8.2 자주 사용되는 명령어 패턴

#### 계산 수식
```javascript
worksheet.setFormula(대상행, 대상열, '=SUM(A1:A10)');
worksheet.setFormula(대상행, 대상열, '=AVERAGE(A1:A10)');
worksheet.setFormula(대상행, 대상열, '=COUNT(A1:A10)');
worksheet.setFormula(대상행, 대상열, '=MAX(A1:A10)');
worksheet.setFormula(대상행, 대상열, '=MIN(A1:A10)');
```

#### 조건부 수식
```javascript
worksheet.setFormula(대상행, 대상열, '=IF(A1>0,"양수","음수")');
worksheet.setFormula(대상행, 대상열, '=VLOOKUP(A2,C:D,2,FALSE)');
worksheet.setFormula(대상행, 대상열, '=COUNTIF(A:A,">10")');
```

#### 값 설정
```javascript
worksheet.setValue(대상행, 대상열, "텍스트");
worksheet.setValue(대상행, 대상열, 123);
worksheet.setValue(대상행, 대상열, new Date());
```

### 8.3 좌표 변환 참고표

| Excel 표기 | SpreadJS 좌표 | 설명 |
|------------|---------------|------|
| A1 | (0, 0) | 첫 번째 행, 첫 번째 열 |
| B1 | (0, 1) | 첫 번째 행, 두 번째 열 |
| A2 | (1, 0) | 두 번째 행, 첫 번째 열 |
| C3 | (2, 2) | 세 번째 행, 세 번째 열 |
| Z1 | (0, 25) | 첫 번째 행, 26번째 열 |

## 🛠️ 트러블슈팅 가이드

### 9.1 일반적인 오류

1. **"스프레드시트가 준비되지 않았습니다"**
   - SpreadJS 인스턴스 초기화 대기 필요
   - `spreadsheetContext?.isReady` 상태 확인

2. **"명령어 검증에 실패했습니다"**
   - 위험한 명령어 패턴 사용
   - 셀 범위가 시트 경계를 벗어남

3. **"JavaScript 명령어 실행 실패"**
   - 문법 오류 또는 존재하지 않는 메서드 호출
   - GC 객체 참조 오류

### 9.2 디버깅 팁

```javascript
// 디버깅용 콘솔 출력 명령어
console.log('현재 시트:', worksheet.name());
console.log('셀 값:', worksheet.getValue(0, 0));
console.log('셀 수식:', worksheet.getFormula(0, 0));
```

## ✅ 결론

현재 시스템은 **JavaScript 형식의 SpreadJS 명령어**를 직접 실행하는 구조로 되어 있습니다. 백엔드에서는 `formulaDetails.spreadjsCommand` 필드에 실행할 JavaScript 코드를 문자열로 전달하면, 프론트엔드에서 이를 안전하게 실행하여 스프레드시트에 반영합니다.

**핵심 포인트:**
1. 모든 명령어는 JavaScript 형식으로 통일
2. 0-based 인덱스 좌표 체계 사용
3. 보안 검증을 통한 안전한 실행
4. 실시간 상태 관리 및 에러 처리
5. Agent 모드에서의 자동 실행 지원

이 문서를 참조하여 백엔드에서 적절한 형식의 명령어를 생성하면, MainSpreadsheet에 원하는 작업을 정확히 적용할 수 있습니다.