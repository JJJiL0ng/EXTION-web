# SpreadJS 시트 렌더링 및 구현 레포트

## 개요
본 레포트는 Next.js 환경에서 구현된 SpreadJS 기반 엑셀 뷰어의 시트 렌더링 메커니즘과 코드 구현에 대해 상세히 분석합니다.

## 1. 아키텍처 구조

### 1.1 파일 구조
```
src/
├── app/(minimal)/spreadjs/
│   └── page.tsx                    # SpreadJS 페이지 컴포넌트
└── components/spreadjs/
    └── Spreadsheet.tsx            # SpreadJS 메인 컴포넌트
```

### 1.2 의존성 및 패키지
```typescript
// 핵심 SpreadJS 패키지
import '@mescius/spread-sheets-resources-ko';  // 한국어 리소스
import '@mescius/spread-sheets-io';            // 파일 I/O 기능
import { SpreadSheets } from "@mescius/spread-sheets-react";  // React 래퍼
import * as GC from "@mescius/spread-sheets";  // 메인 SpreadJS API
```

## 2. 시트 렌더링 메커니즘

### 2.1 초기화 과정

#### 컴포넌트 로딩
```typescript
// page.tsx - 동적 임포트를 통한 SSR 비활성화
const SpreadSheet = dynamic(
  () => import("../../../components/spreadjs/Spreadsheet"),
  { ssr: false }  // 클라이언트 사이드에서만 렌더링
);
```

**이유**: SpreadJS는 브라우저 DOM API에 의존하므로 서버 사이드 렌더링을 비활성화해야 합니다.

#### SpreadJS 인스턴스 생성
```typescript
<SpreadSheets
    workbookInitialized={(spread) => initSpread(spread)}
    hostStyle={hostStyle}>
</SpreadSheets>
```

### 2.2 시트 초기화 프로세스

```typescript
const initSpread = function (spread: any) {
    // 1. SpreadJS 인스턴스 참조 저장
    spreadRef.current = spread;
    
    // 2. 활성 시트 가져오기
    let sheet = spread.getActiveSheet();
    
    // 3. 데이터 설정
    sheet.setValue(1, 1, "값 설정하기");
    sheet.setValue(2, 1, "Number");
    sheet.setValue(2, 2, 23);
    // ...추가 데이터
    
    // 4. 스타일 적용
    sheet.setColumnWidth(1, 200);
    sheet.getRange(1, 1, 1, 2).backColor("rgb(130, 188, 0)");
    
    // 5. 레이아웃 설정
    sheet.addSpan(1, 1, 1, 2);  // 셀 병합
    sheet.setBorder(/* 테두리 설정 */);
};
```

### 2.3 렌더링 라이프사이클

1. **컴포넌트 마운트** → React useRef로 DOM 요소 참조 생성
2. **SpreadJS 초기화** → workbookInitialized 콜백 실행
3. **시트 생성** → 기본 워크시트 생성 및 스타일 적용
4. **DOM 렌더링** → Canvas/SVG 기반 스프레드시트 UI 렌더링
5. **이벤트 바인딩** → 사용자 상호작용 이벤트 리스너 등록

## 3. 상태 관리 및 데이터 플로우

### 3.1 React State 관리
```typescript
const [hostStyle, setHostStyle] = useState({
    width: '100%',
    height: '700px'
});
const [isUploading, setIsUploading] = useState(false);
const [uploadedFileName, setUploadedFileName] = useState<string>("");
const spreadRef = useRef<any>(null);
```

### 3.2 데이터 플로우

```
사용자 액션 → 이벤트 핸들러 → SpreadJS API 호출 → 시트 업데이트 → UI 리렌더링
     ↓
파일 업로드 → 파일 검증 → SpreadJS import() → 시트 데이터 로드 → 화면 표시
```

## 4. 파일 처리 메커니즘

### 4.1 파일 업로드 프로세스

```typescript
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 1. 파일 검증
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];
    
    // 2. 파일 타입 확인
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidType = allowedTypes.includes(file.type) || 
        ['xlsx', 'xls', 'csv'].includes(fileExtension || '');
    
    // 3. SpreadJS import 실행
    spreadRef.current.import(file, successCallback, errorCallback, options);
};
```

### 4.2 Import 옵션 설정
```typescript
const importOptions = {
    fileType: fileExtension === 'csv' ? 
        GC.Spread.Sheets.FileType.csv : 
        GC.Spread.Sheets.FileType.excel,
    includeStyles: true,     // 스타일 포함
    includeFormulas: true    // 수식 포함
};
```

## 5. 렌더링 최적화 전략

### 5.1 성능 최적화
- **동적 로딩**: SSR 비활성화로 초기 로딩 시간 단축
- **메모리 관리**: useRef를 통한 SpreadJS 인스턴스 참조 관리
- **이벤트 최적화**: 파일 업로드 상태 관리로 중복 처리 방지

### 5.2 UI/UX 최적화
```typescript
// 로딩 상태 표시
{isUploading && (
    <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">업로드 중...</span>
    </div>
)}
```

## 6. 에러 처리 및 사용자 피드백

### 6.1 파일 검증 에러
```typescript
if (!isValidType) {
    alert('지원되지 않는 파일 형식입니다. Excel 파일(.xlsx, .xls) 또는 CSV 파일을 선택해주세요.');
    return;
}
```

### 6.2 비동기 작업 에러 처리
```typescript
// 에러 콜백
(error: any) => {
    console.error('파일 업로드 실패:', error);
    setIsUploading(false);
    setUploadedFileName("");
    alert('파일 업로드 중 오류가 발생했습니다.');
}
```

## 7. 주요 기능 구현

### 7.1 새 스프레드시트 생성
```typescript
const handleNewSpreadsheet = () => {
    if (spreadRef.current) {
        spreadRef.current.clearSheets();      // 기존 시트 삭제ㄹ
        spreadRef.current.addSheet(0);        // 새 시트 추가
        const sheet = spreadRef.current.getActiveSheet();
        sheet.name("Sheet1");                 // 시트명 설정
        setUploadedFileName("");              // 상태 초기화
    }
};
```

### 7.2 파일 다운로드
```typescript
const handleDownloadExcel = () => {
    const exportOptions = {
        fileType: GC.Spread.Sheets.FileType.excel,
        includeStyles: true,
        includeFormulas: true
    };
    
    spreadRef.current.export(
        (blob: Blob) => {
            // Blob URL 생성 및 다운로드 링크 생성
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);  // 메모리 정리
        },
        errorCallback,
        exportOptions
    );
};
```

## 8. 기술적 특징

### 8.1 SpreadJS의 렌더링 엔진
- **Canvas 기반 렌더링**: 고성능 그래픽 렌더링
- **가상화**: 대용량 데이터 처리를 위한 가상 스크롤
- **Excel 호환성**: Excel 포맷 완전 지원

### 8.2 React 통합
- **React Wrapper**: SpreadSheets 컴포넌트를 통한 React 통합
- **생명주기 관리**: workbookInitialized 콜백을 통한 초기화
- **상태 동기화**: React state와 SpreadJS 상태 동기화

## 9. 국제화 및 로케일 설정

```typescript
// 한국어 리소스 로드
import '@mescius/spread-sheets-resources-ko';

// 문화권 설정
GC.Spread.Common.CultureManager.culture("ko-kr");
```

## 10. 결론

본 구현은 SpreadJS의 강력한 렌더링 엔진과 React의 컴포넌트 기반 아키텍처를 효과적으로 결합하여 다음과 같은 특징을 가집니다:

- **완전한 Excel 호환성**: 스타일, 수식, 데이터 타입 지원
- **사용자 친화적 인터페이스**: 직관적인 파일 업로드/다운로드
- **성능 최적화**: 대용량 파일 처리 능력
- **확장성**: 추가 기능 통합 용이성

이러한 구현을 통해 웹 브라우저에서 Excel과 동일한 사용자 경험을 제공하는 강력한 스프레드시트 애플리케이션을 구축할 수 있습니다. 