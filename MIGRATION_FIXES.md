# 마이그레이션 에러 수정 가이드

## 주요 에러 유형과 해결 방법

### 1. Import 경로 문제
**에러**: `Cannot find module '@/stores/useUnifiedStore'`
**해결**: 
```typescript
// 기존
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';

// 수정
import { useUnifiedStore } from '@/stores';
```

### 2. 함수명 변경
**에러**: `Cannot find name 'resetStore'`
**해결**: `resetStore` → `resetAllStores`

**에러**: `Cannot find name 'getCurrentSpreadsheetId'`
**해결**: `getCurrentSpreadsheetId()` → `currentSpreadsheetId` (상태로 변경)

### 3. 누락된 함수들
다음 함수들은 새로운 스토어 구조에 포함되어야 합니다:

- `setPendingFormula`: UI 슬라이스에 있음
- `setLoadingState`: UI 슬라이스에 있음  
- `setError`: UI 슬라이스에 있음
- `setComputedDataForSheet`: 제거됨, 직접 computedSheetData 업데이트

### 4. coordsToSheetReference 인수 변경
**에러**: `Expected 4 arguments, but got 3`
**해결**: 
```typescript
// 기존
coordsToSheetReference(row, col)

// 수정  
coordsToSheetReference(sheetIndex, row, col, sheetName)
```

### 5. TypeScript 타입 에러
**에러**: `Parameter 'sheet' implicitly has an 'any' type`
**해결**:
```typescript
// 기존
xlsxData.sheets.map((sheet, index) => ...)

// 수정
xlsxData.sheets.map((sheet: SheetData, index: number) => ...)
```

## 자동 수정 스크립트

다음 명령어로 일괄 수정 가능:

```bash
# 1. Import 경로 수정
find src/components -name "*.tsx" -type f -exec sed -i '' 's/@\/stores\/useUnifiedDataStore/@\/stores/g' {} \;
find src/components -name "*.tsx" -type f -exec sed -i '' 's/useExtendedUnifiedDataStore/useUnifiedStore/g' {} \;

# 2. 함수명 수정  
find src/components -name "*.tsx" -type f -exec sed -i '' 's/resetStore(/resetAllStores(/g' {} \;
find src/components -name "*.tsx" -type f -exec sed -i '' 's/getCurrentSpreadsheetId()/currentSpreadsheetId/g' {} \;

# 3. 좌표 함수 수정
find src/components -name "*.tsx" -type f -exec sed -i '' 's/coordsToSheetReference(\([^,]*\), \([^)]*\))/coordsToSheetReference(0, \1, \2, "Sheet1")/g' {} \;
```

## 수동 수정이 필요한 파일들

### MainSpreadSheet.tsx
- setComputedDataForSheet 호출 제거
- 중복된 return 문 수정
- JSX 태그 닫기 문제 해결

### ChatSidebar.tsx  
- FirebaseChat 타입에 messages 속성 추가 또는 별도 처리
- getSpreadsheetById 함수 구현 또는 대체

### ArtifactRenderer.tsx
- import 경로 수정 완료
- 함수 호출 업데이트 완료

## 검증 방법

```bash
# TypeScript 컴파일 체크
npx tsc --noEmit --skipLibCheck

# 특정 컴포넌트만 체크
npx tsc --noEmit --skipLibCheck src/components/MainSpreadSheet.tsx
```

## 우선순위

1. **즉시 수정 필요**: Import 경로 문제
2. **중요**: 함수명 변경 및 누락된 함수들
3. **나중에 수정 가능**: TypeScript 타입 개선 