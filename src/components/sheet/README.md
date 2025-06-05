# Sheet Components

MainSpreadSheet.tsx가 너무 길어져서 분할한 컴포넌트들입니다.

## 폴더 구조

```
src/components/sheet/
├── README.md                    # 이 파일
├── index.ts                     # 컴포넌트들 export
├── types.ts                     # 공통 타입 정의들
├── HandsontableStyles.tsx       # 글로벌 스타일 컴포넌트
├── ExportControls.tsx           # 내보내기 관련 UI
├── CellInfoBar.tsx              # 상단 셀 정보 표시 바
├── SheetTabs.tsx                # 시트 탭 관리
├── SpreadsheetArea.tsx          # Handsontable 영역
└── hooks/
    ├── useSpreadsheetLogic.ts   # 메인 스프레드시트 로직
    └── useExportHandlers.ts     # 내보내기 관련 로직
```

## 컴포넌트 설명

### HandsontableStyles.tsx
- Handsontable과 관련된 모든 CSS 스타일을 담고 있는 styled-components
- 엑셀과 유사한 디자인, z-index 문제 해결, 반응형 디자인 등
- 글로벌 스타일이므로 메인 컴포넌트에서 한 번만 임포트하면 됨

### ExportControls.tsx
- CSV, XLSX 내보내기 관련 UI 컴포넌트
- 드롭다운, 시트 선택기, 파일명 입력 등의 UI를 포함
- 내보내기 관련 상태와 핸들러를 props로 받음

### CellInfoBar.tsx
- 상단에 표시되는 셀 정보 바 (셀 주소, 수식 편집기 등)
- 선택된 셀의 정보를 표시하고 편집할 수 있는 인터페이스 제공
- 수식 입력, 셀 값 편집 기능 포함

### SheetTabs.tsx
- 하단의 시트 탭 바
- 시트 전환, 새 시트 추가(주석 처리됨), 스크롤바 등
- 여러 시트가 있을 때 시트 간 전환 기능

### SpreadsheetArea.tsx
- 실제 Handsontable 컴포넌트가 렌더링되는 영역
- forwardRef를 사용하여 외부에서 Handsontable 인스턴스에 접근 가능
- 셀 선택, 데이터 변경 등의 이벤트 처리

## 커스텀 훅

### useSpreadsheetLogic.ts
- 스프레드시트의 메인 로직을 담고 있는 훅
- Zustand store와 연결, 로컬 상태 관리
- 셀 선택, 시트 전환, 포뮬러 적용 등의 핵심 기능
- 표시할 데이터 준비, Handsontable 설정 등

### useExportHandlers.ts
- 내보내기 관련 로직만 분리한 훅
- CSV/XLSX 내보내기, 시트 선택, 파일명 설정 등
- ExportControls 컴포넌트와 함께 사용

## 타입 정의 (types.ts)

- `SelectedCellInfo`: 선택된 셀 정보
- `HandsontableSettings`: Handsontable 설정
- `ExportState`: 내보내기 관련 상태
- `SheetTabsState`: 시트 탭 관련 상태  
- `CellEditState`: 셀 편집 관련 상태

## 사용법

```tsx
import MainSpreadSheet from '@/components/MainSpreadSheet';

// 또는 개별 컴포넌트 사용
import { 
  ExportControls, 
  CellInfoBar, 
  useSpreadsheetLogic 
} from '@/components/sheet';
```

## 장점

1. **유지보수성**: 각 기능별로 분리되어 유지보수가 쉬움
2. **재사용성**: 개별 컴포넌트를 다른 곳에서도 사용 가능
3. **테스트 용이성**: 각 컴포넌트를 독립적으로 테스트 가능
4. **코드 가독성**: 기능별로 분리되어 코드를 이해하기 쉬움
5. **성능**: 필요한 컴포넌트만 리렌더링되도록 최적화 가능 