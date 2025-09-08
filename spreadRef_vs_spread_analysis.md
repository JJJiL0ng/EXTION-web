# spreadRef vs spread 비교 분석

## 개요

이 문서는 extion-web 프로젝트에서 사용되고 있는 두 가지 SpreadJS 인스턴스 접근 방식인 `spreadRef`와 `spread`의 차이점을 분석한 결과입니다.

## 1. 기본 개념

### spreadRef
- **타입**: `MutableRefObject<any>`
- **정의**: React의 useRef를 통해 생성된 ref 객체
- **접근 방식**: `spreadRef.current`로 SpreadJS 인스턴스에 접근

### spread
- **타입**: `any | null`
- **정의**: SpreadsheetContext를 통해 제공되는 SpreadJS 인스턴스 상태값
- **접근 방식**: 직접 인스턴스에 접근

## 2. 아키텍처 구조

### spreadRef 사용 패턴
```typescript
// 페이지 레벨에서 생성
const spreadRef = useRef<any>(null);

// MainSpreadSheet에 props로 전달
<MainSpreadSheet spreadRef={spreadRef} />

// SpreadsheetProvider에 전달
<SpreadsheetProvider spreadRef={spreadRef}>
  // 자식 컴포넌트들
</SpreadsheetProvider>

// SpreadJS 초기화 시 할당
spreadRef.current = spreadInstance;
```

### spread 사용 패턴
```typescript
// Context를 통한 접근
const { spread } = useSpreadsheetContext();

// 직접 사용
spread.getActiveSheet();
spread.options.allowDynamicArray = true;
```

## 3. 데이터 흐름

### spreadRef의 데이터 흐름
1. **생성**: 페이지 컴포넌트에서 `useRef<any>(null)`로 생성
2. **전달**: Props로 하위 컴포넌트들에 전달
3. **할당**: `useSpreadJSInit` 훅에서 SpreadJS 초기화 후 `spreadRef.current = spread` 할당
4. **사용**: 필요한 곳에서 `spreadRef.current`로 접근

### spread의 데이터 흐름
1. **수집**: SpreadsheetContext에서 `spreadRef.current` 값을 폴링 (100ms 간격)
2. **상태화**: useState를 통해 `spread` 상태로 관리
3. **제공**: Context를 통해 하위 컴포넌트들에 제공
4. **사용**: `useSpreadsheetContext()` 훅을 통해 접근

## 4. 주요 차이점

### 4.1 접근성 및 편의성

**spreadRef**
- ❌ `.current`를 통한 간접 접근 필요
- ❌ Props drilling 필요 (상위에서 하위로 전달)
- ✅ 직접적인 ref 접근으로 성능상 약간 유리

**spread**
- ✅ 직접 접근 가능
- ✅ Context를 통해 어디서든 접근 가능
- ✅ 더 깔끔한 코드 작성 가능

### 4.2 타입 안전성

**spreadRef**
```typescript
// null 체크 필요
if (!spreadRef.current) return;
const sheet = spreadRef.current.getActiveSheet();
```

**spread**
```typescript
// Context에서 이미 null 체크 및 준비 상태 관리
const { spread, isReady } = useSpreadsheetContext();
if (!isReady) return;
const sheet = spread.getActiveSheet();
```

### 4.3 상태 관리

**spreadRef**
- 인스턴스 준비 상태를 별도로 관리해야 함
- 초기화 완료 여부를 직접 체크해야 함

**spread**
- Context에서 `isReady` 상태 제공
- 폴링을 통한 자동 상태 업데이트
- 초기화 완료 시 자동으로 콘솔 로그 출력

### 4.4 성능 측면

**spreadRef**
- ✅ 직접 접근으로 약간 더 빠름
- ❌ Props drilling으로 인한 불필요한 re-render 가능성

**spread**
- ❌ 100ms마다 폴링하여 약간의 오버헤드
- ❌ Context 값 변경 시 구독하는 모든 컴포넌트 re-render
- ✅ 상태 기반 접근으로 React 패턴에 더 적합

## 5. 사용 사례별 분석

### 5.1 현재 사용 중인 파일들

#### spreadRef 사용
- `MainSpreadSheet.tsx`: SpreadJS 인스턴스 초기화 및 주요 기능
- `useSpreadJSInit.ts`: 초기화 로직
- `useSpreadjsCommandEngine.ts`: 명령어 엔진 (주석 처리됨)
- `useSpreadjsCommandStore.ts`: 명령어 스토어 (주석 처리됨)

#### spread 사용
- `ChatInputBox.tsx`: 채팅 입력 시 spread 옵션 설정
- `useSpreadSheetNames.ts`: 시트 이름 관리
- `useGetActiveSheetName.ts`: 활성 시트 이름 조회
- `SelectedSheetNameCard.tsx`: 선택된 시트 정보 표시

### 5.2 사용 패턴 차이

**직접 조작이 필요한 경우**: spreadRef 선호
```typescript
// 파일 업로드/내보내기, 초기화 등
const jsonData = spreadRef.current.toJSON({...});
spreadRef.current.fromJSON(data);
```

**상태 기반 접근이 필요한 경우**: spread 선호
```typescript
// 옵션 설정, 정보 조회 등
spread.options.allowDynamicArray = true;
const sheetCount = spread?.getSheetCount?.() ?? 0;
```

## 6. 권장사항

### 6.1 사용 지침

1. **초기화 및 생명주기 관리**: `spreadRef` 사용
   - SpreadJS 인스턴스 생성/소멸
   - 파일 업로드/다운로드
   - 대량 데이터 조작

2. **일반적인 상태 접근**: `spread` 사용
   - 시트 정보 조회
   - 옵션 설정
   - 이벤트 바인딩
   - UI 컴포넌트에서의 접근

### 6.2 개선 방안

1. **타입 안전성 강화**
   ```typescript
   interface SpreadsheetContextType {
     spread: GC.Spread.Sheets.Workbook | null;  // any 대신 구체적 타입
     isReady: boolean;
   }
   ```

2. **폴링 최적화**
   - 100ms 폴링을 더 효율적인 방식으로 개선
   - 인스턴스 준비 완료 후 폴링 중단 로직 보완

3. **에러 핸들링 강화**
   - Context에서 에러 상태 관리
   - 인스턴스 접근 실패 시 적절한 fallback 제공

## 7. 결론

두 방식 모두 각각의 장단점이 있으며, 현재 프로젝트에서는 **용도에 따라 적절히 분리하여 사용**하고 있습니다:

- **spreadRef**: 저수준 접근이 필요한 초기화, 파일 조작 등
- **spread**: 일반적인 상태 접근이 필요한 UI 컴포넌트, 정보 조회 등

이러한 접근 방식은 **관심사의 분리**를 통해 코드의 가독성과 유지보수성을 향상시키는 좋은 패턴으로 보입니다.