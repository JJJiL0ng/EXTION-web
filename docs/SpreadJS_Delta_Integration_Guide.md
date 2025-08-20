# SpreadJS 델타 기반 자동저장 시스템 통합 가이드

SpreadJS 클라이언트와 Extion Server의 델타 기반 자동저장 시스템을 연동하는 완전한 구현이 완료되었습니다.

## 📁 파일 구조

```
src/
├── _types/
│   └── delta.ts                          # 델타 관련 타입 정의
├── _hooks/sheet/
│   ├── useSpreadSheetDelta.ts            # 메인 델타 관리 훅
│   └── useSpreadSheetDeltaApply.ts       # 델타 적용 유틸리티 훅
├── _components/sheet/
│   └── MainSpreadSheet.tsx               # 업데이트된 메인 컴포넌트
└── _Api/sheet/
    └── sheetApi.ts                       # API 클라이언트 (기존)
```

## 🔧 구현된 기능

### 1. 자동 델타 감지 및 전송
- SpreadJS 이벤트를 자동으로 감지하여 델타 생성
- 배치 처리를 통한 성능 최적화 (기본 500ms 간격)
- 최대 배치 크기 제한 (기본 50개)

### 2. 에러 처리 및 재시도
- 지수 백오프를 사용한 자동 재시도 (최대 3회)
- 실패한 델타들의 별도 관리
- 수동 재시도 기능

### 3. 실시간 상태 표시
- 동기화 진행 상태 표시
- 실패한 델타 개수 및 재시도 버튼
- 마지막 동기화 시간 표시

### 4. 서버 델타 적용
- WebSocket을 통해 받은 서버 델타를 SpreadJS에 실시간 적용
- 무한 루프 방지를 위한 상태 관리

## 🚀 사용 방법

### 1. 기본 사용
메인 컴포넌트에서 이미 통합되어 있어 별도 설정이 필요 없습니다.

```typescript
// MainSpreadSheet.tsx에서 자동으로 초기화됨
const deltaManager = useSpreadSheetDelta({
  userId: getUserId(),
  spreadsheetId: spreadSheetId,
  batchTimeout: 500,
  maxRetries: 3,
  maxBatchSize: 50,
  onDeltaApplied: (delta) => console.log('델타 적용:', delta),
  onError: (error) => console.error('델타 에러:', error),
  onSync: (count) => console.log('동기화 완료:', count)
});
```

### 2. 수동 조작
필요한 경우 수동으로 델타 관리 기능을 사용할 수 있습니다:

```typescript
// 강제 동기화
await deltaManager.forcSync();

// 실패한 델타 재시도
await deltaManager.retryFailedDeltas();

// 실패한 델타 목록 초기화
deltaManager.clearFailedDeltas();

// 수동으로 델타 큐에 추가
deltaManager.queueDelta({
  action: DeltaAction.SET_CELL_VALUE,
  sheetName: 'Sheet1',
  cellAddress: 'A1',
  value: '새 값',
  timestamp: Date.now()
});
```

### 3. 서버에서 델타 수신
WebSocket이나 Server-Sent Events를 통해 서버에서 델타를 받을 때:

```typescript
// WebSocket 연결 예시
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (event) => {
  const serverDelta = JSON.parse(event.data);
  deltaManager.applyServerDelta(serverDelta);
};
```

## 📊 지원되는 델타 액션

| 액션 | 설명 | 필수 파라미터 |
|------|------|---------------|
| `SET_CELL_VALUE` | 셀 값 설정 | `sheetName`, `cellAddress`, `value` |
| `SET_CELL_FORMULA` | 셀 수식 설정 | `sheetName`, `cellAddress`, `formula` |
| `SET_CELL_STYLE` | 셀 스타일 설정 | `sheetName`, `cellAddress`/`range`, `style` |
| `DELETE_CELLS` | 셀 삭제 | `sheetName`, `cellAddress`/`range` |
| `INSERT_ROWS` | 행 삽입 | `sheetName`, `rowIndex`, `count` |
| `DELETE_ROWS` | 행 삭제 | `sheetName`, `rowIndex`, `count` |
| `INSERT_COLUMNS` | 열 삽입 | `sheetName`, `columnIndex`, `count` |
| `DELETE_COLUMNS` | 열 삭제 | `sheetName`, `columnIndex`, `count` |
| `ADD_SHEET` | 시트 추가 | `sheetName` |
| `DELETE_SHEET` | 시트 삭제 | `sheetName` |
| `RENAME_SHEET` | 시트 이름 변경 | `sheetName`, `value` |

## 🎯 상태 관리

### DeltaState 인터페이스
```typescript
interface DeltaState {
  isPending: boolean;        // 대기 중인 델타가 있는지
  isProcessing: boolean;     // 현재 처리 중인지
  lastSyncAt: string | null; // 마지막 동기화 시간
  queuedDeltas: number;      // 대기 중인 델타 개수
  failedDeltas: CellDelta[]; // 실패한 델타 목록
  error: string | null;      // 마지막 에러 메시지
}
```

## 🔄 자동저장 스토어 연동

델타 시스템은 기존 `useSpreadjsCommandStore`와 연동되어 자동저장 상태를 업데이트합니다:

- `setAutosavePending()`: 델타 큐에 추가될 때 호출
- `setAutosaveInProgress()`: 배치 전송 중일 때 호출
- `setLastSavedAt()`: 성공적으로 동기화되었을 때 호출
- `setAutosaveError()`: 에러 발생 시 호출

## 🎨 UI 상태 표시

상단 바에 다음과 같은 상태가 표시됩니다:

1. **동기화 진행 중**: 🔄 "동기화 중..." + 회전 아이콘
2. **대기 중인 변경사항**: 🔄 "변경사항 N개 대기" + 회전 아이콘
3. **실패한 델타**: ⚠️ "실패 N개" + 재시도 버튼
4. **마지막 동기화 시간**: "동기화: 14:23:45"
5. **에러 메시지**: ❌ 에러 내용 + 닫기 버튼

## ⚠️ 주의사항

### 1. 성능 고려사항
- 배치 타이머는 너무 짧게 설정하지 마세요 (최소 100ms 권장)
- 최대 배치 크기는 서버 처리 능력에 맞게 조정하세요
- 대용량 데이터 변경 시에는 `forcSync()`를 사용하세요

### 2. 에러 처리
- 네트워크 연결이 불안정한 환경에서는 `maxRetries`를 늘리세요
- 중요한 데이터는 실패한 델타 목록을 주기적으로 확인하세요

### 3. 메모리 관리
- 컴포넌트 언마운트 시 자동으로 정리됩니다
- 장시간 사용 시 주기적으로 `clearFailedDeltas()`를 호출하세요

## 🔧 커스터마이징

### 1. 배치 설정 변경
```typescript
const deltaManager = useSpreadSheetDelta({
  userId: getUserId(),
  batchTimeout: 1000,    // 1초로 변경
  maxBatchSize: 100,     // 100개로 변경
  maxRetries: 5,         // 5회로 변경
  // ... 기타 설정
});
```

### 2. 커스텀 에러 핸들링
```typescript
const deltaManager = useSpreadSheetDelta({
  userId: getUserId(),
  onError: (error, context) => {
    // 커스텀 에러 처리
    if (error.message.includes('network')) {
      // 네트워크 에러 특별 처리
      showNetworkErrorDialog();
    } else {
      // 일반 에러 처리
      console.error('델타 에러:', error, context);
    }
  },
  // ... 기타 설정
});
```

### 3. 델타 필터링
필요한 경우 특정 유형의 델타만 전송하도록 필터링할 수 있습니다:

```typescript
// useSpreadSheetDelta.ts 내부에서 수정
const queueDelta = useCallback((delta: CellDelta) => {
  // 스타일 변경은 무시
  if (delta.action === DeltaAction.SET_CELL_STYLE) {
    return;
  }
  
  // 기존 로직 계속...
}, []);
```

## 📈 모니터링

### 1. 델타 통계
```typescript
// 델타 상태 모니터링
console.log('현재 델타 상태:', deltaManager.state);
console.log('대기 중인 델타:', deltaManager.state.queuedDeltas);
console.log('실패한 델타:', deltaManager.state.failedDeltas.length);
```

### 2. 성능 메트릭
델타 처리 성능을 모니터링하려면 콜백에서 시간을 측정하세요:

```typescript
const deltaManager = useSpreadSheetDelta({
  userId: getUserId(),
  onSync: (syncedDeltas) => {
    const now = Date.now();
    console.log(`${syncedDeltas}개 델타 동기화 완료 (${now}ms)`);
  },
  // ... 기타 설정
});
```

## 🎉 결론

SpreadJS 델타 기반 자동저장 시스템이 성공적으로 구현되어 다음과 같은 이점을 제공합니다:

1. **실시간 자동저장**: 사용자의 모든 변경사항이 자동으로 서버에 저장됩니다
2. **성능 최적화**: 배치 처리를 통해 네트워크 요청을 최소화합니다  
3. **안정성**: 에러 처리 및 자동 재시도를 통해 데이터 손실을 방지합니다
4. **사용자 경험**: 실시간 상태 표시로 사용자에게 명확한 피드백을 제공합니다
5. **확장성**: 다양한 델타 액션을 지원하여 모든 SpreadJS 기능을 커버합니다

이제 SpreadJS에서 작업하는 모든 변경사항이 자동으로 Extion Server와 동기화되며, 여러 사용자가 동시에 작업할 때도 실시간으로 변경사항이 공유됩니다.