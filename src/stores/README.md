# Zustand Store 구조 및 DevTools 가이드

## 📁 스토어 구조

```
src/stores/
├── index.ts                 # 통합 스토어 (메인)
├── individual-stores.ts     # 개별 스토어 (디버깅용)
├── authStore.ts            # 인증 스토어
├── slices/
│   ├── spreadsheetSlice.ts # 스프레드시트 상태 관리
│   ├── chatSlice.ts        # 채팅 상태 관리
│   └── uiSlice.ts          # UI 상태 관리
├── store-types/
│   └── index.ts            # 타입 정의
└── store-utils/
    └── xlsxUtils.ts        # 유틸리티 함수
```

## 🔧 DevTools 설정

### 1. 통합 스토어 (권장)

모든 슬라이스가 하나의 스토어로 통합되어 관리됩니다.

```typescript
// src/stores/index.ts
export const useUnifiedStore = create<UnifiedStore>()(
    devtools(
        (set, get, store) => ({
            ...createSpreadsheetSlice(set, get, store),
            ...createChatSlice(set, get, store),
            ...createUISlice(set, get, store),
        }),
        {
            name: 'unified-store',
            enabled: process.env.NODE_ENV === 'development',
            trace: true,
            partialize: (state) => ({
                // 스토어별로 구분된 상태 표시
                spreadsheet: { /* ... */ },
                chat: { /* ... */ },
                ui: { /* ... */ }
            })
        }
    )
);
```

### 2. 개별 스토어 (디버깅 전용)

각 슬라이스를 독립적으로 디버깅할 때 사용합니다.

```typescript
// src/stores/individual-stores.ts
export const useSpreadsheetStore = create<SpreadsheetSlice>()(
    devtools(/* ... */, { name: 'spreadsheet-store' })
);

export const useChatStore = create<ChatSlice>()(
    devtools(/* ... */, { name: 'chat-store' })
);

export const useUIStore = create<UISlice>()(
    devtools(/* ... */, { name: 'ui-store' })
);
```

## 🚀 사용법

### 기본 사용 (권장)

```typescript
import { useUnifiedStore } from '@/stores';

const MyComponent = () => {
    // 스프레드시트 관련
    const { xlsxData, setXLSXData, activeSheetData } = useUnifiedStore();
    
    // 채팅 관련
    const { currentChatId, chatSessions, createNewChatSession } = useUnifiedStore();
    
    // UI 관련
    const { loadingStates, errors, setLoadingState } = useUnifiedStore();
    
    // ...
};
```

### 개별 스토어 사용 (디버깅 시)

```typescript
import { useSpreadsheetStore, useChatStore, useUIStore } from '@/stores/individual-stores';

const DebugComponent = () => {
    // 각각 독립적인 devtools 인스턴스로 관리
    const spreadsheetState = useSpreadsheetStore();
    const chatState = useChatStore();
    const uiState = useUIStore();
    
    // ...
};
```

## 🛠️ DevTools 기능

### 1. 액션 추적
모든 상태 변경이 액션 이름과 함께 기록됩니다:

```typescript
set({ saveStatus: 'modified' }, false, 'updateCellData');
//                               ^^^^^ ^^^^^^^^^^^^^^
//                             replace  action name
```

### 2. 스토어 분할 표시
통합 스토어에서 각 슬라이스별로 구분된 상태를 확인할 수 있습니다:

```
unified-store
├── spreadsheet
│   ├── xlsxData
│   ├── activeSheetData
│   └── saveStatus
├── chat
│   ├── chatSessions
│   ├── currentChatId
│   └── sheetMessages
└── ui
    ├── loadingStates
    ├── errors
    └── modals
```

### 3. 개발 환경에서만 활성화
프로덕션 빌드에서는 자동으로 비활성화됩니다.

## 🎯 디버깅 팁

### 1. Redux DevTools 사용

1. Chrome Extension 설치: [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
2. 개발자 도구 → Redux 탭에서 상태 확인
3. Time Travel 디버깅 가능

### 2. 액션 로깅

```typescript
import { logAction, createActionLogger } from '@/utils/store';

// 전역 로깅
logAction('updateCell', { row: 1, col: 2, value: 'test' });

// 스토어별 로깅
const logger = createActionLogger('spreadsheet');
logger('updateCell', payload);
```

### 3. 상태 추적

```typescript
// 특정 상태 변경 감지
useEffect(() => {
    const unsubscribe = useUnifiedStore.subscribe(
        (state) => state.saveStatus,
        (saveStatus) => console.log('Save status changed:', saveStatus)
    );
    
    return unsubscribe;
}, []);
```

## 🔍 트러블슈팅

### DevTools가 표시되지 않는 경우

1. `NODE_ENV=development` 확인
2. Redux DevTools Extension 설치 확인
3. 브라우저 새로고침

### 액션이 기록되지 않는 경우

```typescript
// ❌ 잘못된 방법
set({ value: newValue });

// ✅ 올바른 방법
set({ value: newValue }, false, 'actionName');
```

### 성능 이슈 발생 시

```typescript
// trace 비활성화
devtools(storeConfig, { 
    name: 'store-name',
    trace: false  // 액션 추적 비활성화
})
```

---

이 설정을 통해 각 스토어의 상태 변화를 효율적으로 디버깅할 수 있습니다! 🎉 