# MainChatComponent 리팩토링 가이드

## 개요
기존의 1,679줄 대용량 `MainChatComponent.tsx` 파일을 여러 개의 작은 모듈로 분리하여 코드의 가독성, 유지보수성, 재사용성을 향상시켰습니다.

## 리팩토링 전후 비교

### Before (기존)
- **단일 파일**: `MainChatComponent.tsx` (1,679줄)
- **모든 로직이 하나의 컴포넌트에 집중**
- **중복 코드 존재**
- **테스트 및 유지보수 어려움**

### After (리팩토링 후)
- **메인 컴포넌트**: `MainChatComponent.tsx` (약 200줄)
- **6개의 커스텀 훅으로 로직 분리**
- **1개의 유틸리티 클래스**
- **1개의 타입 정의 파일**

## 파일 구조

```
src/
├── types/
│   └── chat.ts                    # 채팅 관련 타입 정의
├── utils/
│   └── chatResponseHandlers.ts    # 채팅 응답 처리 유틸리티
├── hooks/
│   ├── useChatState.ts           # 채팅 상태 관리
│   ├── useFileProcessing.ts      # 파일 처리 로직
│   ├── useChatHandlers.ts        # 채팅 핸들러 관리
│   └── useChatSession.ts         # 세션 관리
└── components/chat/
    └── MainChatComponent.tsx      # 메인 컴포넌트 (리팩토링됨)
```

## 분리된 모듈 설명

### 1. 타입 정의 (`src/types/chat.ts`)
- `ChatMode`: 채팅 모드 타입
- `ChatLoadingState`: 로딩 상태 인터페이스
- `ChatInputState`: 입력 상태 인터페이스
- `AppliedActionsState`: 적용된 액션 상태 인터페이스
- `LOADING_HINTS`: 로딩 힌트 상수

### 2. 응답 처리 유틸리티 (`src/utils/chatResponseHandlers.ts`)
- `ChatResponseHandler`: 다양한 채팅 응답 타입 처리
  - 아티팩트 응답 처리
  - 함수 실행 응답 처리
  - 데이터 수정 응답 처리
  - 데이터 편집 응답 처리
  - 데이터 생성 응답 처리
  - 일반 채팅 응답 처리

### 3. 커스텀 훅들

#### `useChatState.ts`
- 채팅 모드, 로딩 상태, 입력 상태 관리
- 로딩 진행률 및 힌트 메시지 관리
- 적용된 액션 상태 관리

#### `useFileProcessing.ts`
- 파일 업로드 및 처리 로직
- XLSX, CSV 파일 처리
- 드래그 앤 드롭 핸들링
- 스프레드시트 저장 기능

#### `useChatHandlers.ts`
- 메시지 전송 로직
- 데이터 수정 적용 핸들러
- 함수 결과 적용 핸들러
- 아티팩트 클릭 핸들러

#### `useChatSession.ts`
- 채팅 세션 저장 및 로드
- 주기적 세션 백업
- 컴포넌트 언마운트 시 세션 저장

## 주요 개선사항

### 1. 코드 분리 및 모듈화
- 관심사의 분리 (Separation of Concerns)
- 단일 책임 원칙 (Single Responsibility Principle) 적용
- 재사용 가능한 커스텀 훅 생성

### 2. 중복 코드 제거
- 파일 처리 로직 통합
- 응답 처리 로직 통합
- 공통 상태 관리 로직 분리

### 3. 타입 안전성 향상
- 명확한 타입 정의
- 인터페이스를 통한 계약 정의
- 타입 추론 개선

### 4. 테스트 용이성
- 각 훅을 독립적으로 테스트 가능
- 모킹이 쉬운 구조
- 단위 테스트 작성 용이

### 5. 유지보수성 향상
- 기능별로 파일이 분리되어 수정 범위 최소화
- 명확한 의존성 관계
- 코드 가독성 향상

## 사용법

### 기존 방식
```tsx
// 모든 로직이 하나의 컴포넌트에 있었음
export default function MainChatComponent() {
  // 1,679줄의 코드...
}
```

### 리팩토링 후
```tsx
export default function MainChatComponent() {
  // 커스텀 훅들 사용
  const chatState = useChatState();
  const fileProcessing = useFileProcessing(...);
  const chatHandlers = useChatHandlers(...);
  
  // 간결한 컴포넌트 로직
  return (
    // JSX...
  );
}
```

## 마이그레이션 가이드

### 기존 코드에서 새 구조로 이동하기

1. **타입 사용**:
   ```tsx
   import { ChatMode, LOADING_HINTS } from '@/types/chat';
   ```

2. **응답 처리**:
   ```tsx
   import { ChatResponseHandler } from '@/utils/chatResponseHandlers';
   
   const mode = await ChatResponseHandler.handleUnifiedResponse(response, params);
   ```

3. **커스텀 훅 사용**:
   ```tsx
   import { useChatState } from '@/hooks/useChatState';
   
   const { currentMode, loadingState, setCurrentMode } = useChatState();
   ```

## 성능 최적화

### 메모이제이션
- `useCallback`을 사용한 함수 메모이제이션
- 불필요한 리렌더링 방지

### 상태 관리
- 관련된 상태들을 그룹화
- 상태 업데이트 최적화

### 코드 스플리팅
- 필요한 모듈만 로드
- 번들 크기 최적화

## 추후 개선 계획

1. **에러 바운더리 추가**
2. **로딩 상태 통합 관리**
3. **성능 모니터링 추가**
4. **단위 테스트 작성**
5. **스토리북 컴포넌트 문서화**

## 주의사항

- 기존 API 호환성 유지
- 기존 컴포넌트 인터페이스 보존
- 점진적 마이그레이션 지원 