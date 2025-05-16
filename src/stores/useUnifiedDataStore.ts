// 통합 데이터 스토어: CSV 데이터, 수식, 아티팩트 관리를 위한 전역 상태 관리
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// CSV 데이터 인터페이스 정의
interface CSVData {
  headers: string[]; // 헤더 배열
  data: string[][]; // 2차원 데이터 배열
  fileName: string; // 파일 이름
}

// 시트 컨텍스트 인터페이스 정의
interface SheetContext {
  sheetName: string; // 시트 이름
  headers: HeaderInfo[]; // 헤더 정보 배열
  dataRange: DataRange; // 데이터 범위
  sampleData?: Record<string, string>[]; // 샘플 데이터
}

// 헤더 정보 인터페이스
interface HeaderInfo {
  column: string; // 열 식별자 (A, B, C 등)
  name: string; // 열 이름
}

// 데이터 범위 인터페이스
interface DataRange {
  startRow: string; // 시작 행
  endRow: string; // 끝 행
  startColumn?: string; // 시작 열
  endColumn?: string; // 끝 열
}

// 수식 적용 인터페이스
interface FormulaApplication {
  formula: string; // 수식 문자열
  cellAddress: string; // 셀 주소 (예: A1, B2)
  explanation: string; // 수식 설명
  timestamp: Date; // 타임스탬프
}

// 아티팩트 코드 인터페이스
interface ArtifactCode {
  code: string; // 코드 문자열
  type: 'chart' | 'table' | 'analysis'; // 아티팩트 유형
  timestamp: Date; // 타임스탬프
  title?: string; // 제목
  messageId?: string; // 채팅 메시지와 연결하기 위한 ID
}

// 통합 데이터 스토어 상태 인터페이스
interface UnifiedDataStoreState {
  // === Raw CSV Data ===
  rawCsvData: CSVData | null; // 원본 CSV 데이터
  
  // === Computed Data (포뮬러 결과 포함) ===
  computedData: string[][] | null; // 계산된 데이터 (수식 적용 후)
  
  // === Sheet Context (derived from rawCsvData) ===
  sheetContext: SheetContext | null; // 시트 컨텍스트 (원본 데이터에서 파생)
  
  // === Loading States ===
  loadingStates: {
    fileUpload: boolean; // 파일 업로드 로딩 상태
    formulaGeneration: boolean; // 수식 생성 로딩 상태
    artifactGeneration: boolean; // 아티팩트 생성 로딩 상태
  };
  
  // === Error States ===
  errors: {
    fileError: string | null; // 파일 오류
    formulaError: string | null; // 수식 오류
    artifactError: string | null; // 아티팩트 오류
  };
  
  // === Formula Management ===
  pendingFormula: FormulaApplication | null; // 대기 중인 수식
  formulaHistory: FormulaApplication[]; // 수식 기록
  
  // === Artifact Management ===
  artifactCode: ArtifactCode | null; // 현재 아티팩트 코드
  artifactHistory: ArtifactCode[]; // 생성된 아티팩트들의 히스토리
  
  // === Modal State ===
  isArtifactModalOpen: boolean; // 아티팩트 모달 열림 상태
  activeArtifactId: string | null; // 현재 모달에서 보고 있는 아티팩트 ID
  
  // === Internal Flags ===
  isInternalUpdate: boolean; // 내부 업데이트 플래그
}

// 통합 데이터 스토어 액션 인터페이스
interface UnifiedDataStoreActions {
  // === CSV Data Actions ===
  setRawCsvData: (data: CSVData | null) => void; // 원본 CSV 데이터 설정
  updateCellData: (row: number, col: number, value: string) => void; // 셀 데이터 업데이트
  setComputedData: (data: string[][] | null) => void; // 계산된 데이터 설정
  
  // === Loading Actions ===
  setLoadingState: (type: keyof UnifiedDataStoreState['loadingStates'], loading: boolean) => void; // 로딩 상태 설정
  
  // === Error Actions ===
  setError: (type: keyof UnifiedDataStoreState['errors'], error: string | null) => void; // 오류 설정
  
  // === Formula Actions ===
  setPendingFormula: (formula: FormulaApplication | null) => void; // 대기 중인 수식 설정
  addToFormulaHistory: (formula: FormulaApplication) => void; // 수식 기록에 추가
  clearFormulaHistory: () => void; // 수식 기록 지우기
  applyPendingFormula: () => void; // 대기 중인 수식 적용
  
  // === Artifact Actions ===
  setArtifactCode: (code: ArtifactCode | null) => void; // 아티팩트 코드 설정
  addToArtifactHistory: (artifact: ArtifactCode) => void; // 아티팩트 기록에 추가
  clearArtifactHistory: () => void; // 아티팩트 기록 지우기
  
  // === Modal Actions ===
  openArtifactModal: (artifactId?: string) => void; // 아티팩트 모달 열기
  closeArtifactModal: () => void; // 아티팩트 모달 닫기
  setActiveArtifact: (artifactId: string | null) => void; // 활성 아티팩트 설정
  
  // === Internal Actions ===
  setInternalUpdate: (flag: boolean) => void; // 내부 업데이트 플래그 설정
  
  // === Computed Actions ===
  updateSheetContext: () => void; // 시트 컨텍스트 업데이트
  getCurrentData: () => string[][] | null; // 현재 데이터 가져오기
  getArtifactById: (id: string) => ArtifactCode | null; // ID로 아티팩트 가져오기
  
  // === Utility Actions ===
  cellAddressToCoords: (cellAddress: string) => { row: number; col: number }; // 셀 주소를 좌표로 변환
  resetStore: () => void; // 스토어 초기화
}

// 통합 데이터 스토어 타입 정의
type UnifiedDataStore = UnifiedDataStoreState & UnifiedDataStoreActions;

// 헬퍼 함수: CSV 데이터를 SheetContext로 변환
const generateSheetContext = (csvData: CSVData): SheetContext => {
  // 헤더 정보 생성 (A, B, C 등의 열 식별자와 이름 매핑)
  const headers: HeaderInfo[] = csvData.headers.map((header, index) => ({
    column: String.fromCharCode(65 + index), // A=65, B=66, ...
    name: header
  }));

  // 데이터 범위 정의
  const dataRange: DataRange = {
    startRow: '2', // 첫 번째 행은 헤더이므로 데이터는 2행부터 시작
    endRow: (csvData.data.length + 1).toString(), // 데이터 행 수 + 1 (헤더 포함)
    startColumn: 'A', // 시작 열은 항상 A
    endColumn: String.fromCharCode(64 + csvData.headers.length) // 끝 열은 헤더 개수에 따라 결정
  };

  // 샘플 데이터 생성 (최대 3개 행)
  const sampleData = csvData.data.slice(0, 3).map(row => {
    const rowData: Record<string, string> = {};
    csvData.headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });
    return rowData;
  });

  // 시트 컨텍스트 반환
  return {
    sheetName: csvData.fileName || 'Sheet1', // 파일 이름 또는 기본값
    headers,
    dataRange,
    sampleData
  };
};

// 셀 주소를 행과 열 인덱스로 변환하는 함수 (예: A1 -> {row: 0, col: 0})
const cellAddressToCoords = (cellAddress: string): { row: number; col: number } => {
  // 정규식으로 열 문자와 행 번호 추출 (예: A1 -> A, 1)
  const match = cellAddress.match(/([A-Z]+)([0-9]+)/);
  if (!match) throw new Error(`유효하지 않은 셀 주소: ${cellAddress}`);
  
  const [, colStr, rowStr] = match;
  
  // 컬럼 문자를 숫자로 변환 (A=0, B=1, ...)
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65);
  }
  
  // 행은 0-based index로 변환 (1-based에서 0-based로)
  const row = parseInt(rowStr) - 1;
  
  return { row, col };
};

// Zustand 스토어 생성
export const useUnifiedDataStore = create<UnifiedDataStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      rawCsvData: null,
      computedData: null,
      sheetContext: null,
      loadingStates: {
        fileUpload: false,
        formulaGeneration: false,
        artifactGeneration: false,
      },
      errors: {
        fileError: null,
        formulaError: null,
        artifactError: null,
      },
      pendingFormula: null,
      formulaHistory: [],
      artifactCode: null,
      artifactHistory: [],
      isArtifactModalOpen: false,
      activeArtifactId: null,
      isInternalUpdate: false,
      
      // CSV 데이터 액션
      setRawCsvData: (data) => {
        set((state) => {
          const newState = { 
            ...state, 
            rawCsvData: data,
            computedData: data ? [...data.data] : null // 원본 데이터로 계산된 데이터 초기화
          };
          
          // SheetContext 자동 업데이트
          if (data) {
            newState.sheetContext = generateSheetContext(data);
          } else {
            newState.sheetContext = null;
          }
          
          return newState;
        });
      },
      
      // 셀 데이터 업데이트
      updateCellData: (row, col, value) => {
        set((state) => {
          if (!state.rawCsvData || !state.computedData) return state;
          
          // Raw 데이터 업데이트
          const newRawData = { ...state.rawCsvData };
          if (newRawData.data[row]) {
            newRawData.data[row] = [...newRawData.data[row]];
            newRawData.data[row][col] = value;
          }
          
          // Computed 데이터 업데이트
          const newComputedData = [...state.computedData];
          if (newComputedData[row]) {
            newComputedData[row] = [...newComputedData[row]];
            newComputedData[row][col] = value;
          }
          
          return {
            ...state,
            rawCsvData: newRawData,
            computedData: newComputedData,
            sheetContext: generateSheetContext(newRawData) // 시트 컨텍스트 재생성
          };
        });
      },
      
      // 계산된 데이터 설정
      setComputedData: (data) => set({ computedData: data }),
      
      // 로딩 상태 액션
      setLoadingState: (type, loading) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, [type]: loading }
        })),
      
      // 오류 상태 액션
      setError: (type, error) =>
        set((state) => ({
          errors: { ...state.errors, [type]: error }
        })),
      
      // 수식 액션
      setPendingFormula: (formula) => set({ pendingFormula: formula }),
      
      // 수식 히스토리에 추가
      addToFormulaHistory: (formula) =>
        set((state) => ({
          formulaHistory: [...state.formulaHistory, formula]
        })),
      
      // 수식 히스토리 초기화
      clearFormulaHistory: () => set({ formulaHistory: [] }),
      
      // 대기 중인 수식 적용
      applyPendingFormula: () => {
        const { pendingFormula, computedData, rawCsvData } = get();
        if (!pendingFormula || !computedData || !rawCsvData) return;
        
        try {
          // 셀 주소를 행/열 인덱스로 변환
          const { row, col } = cellAddressToCoords(pendingFormula.cellAddress);
          
          const formulaValue = pendingFormula.formula;
          
          // 셀 업데이트
          const newComputedData = [...computedData];
          if (!newComputedData[row]) {
            // 행이 존재하지 않으면 생성
            newComputedData[row] = new Array(rawCsvData.headers.length).fill('');
          }
          newComputedData[row][col] = formulaValue;
          
          set({
            computedData: newComputedData,
            pendingFormula: null // 적용 후 대기 수식 초기화
          });
          
          console.log('수식이 성공적으로 적용되었습니다', {
            formula: formulaValue,
            cellAddress: pendingFormula.cellAddress,
            row,
            col
          });
        } catch (error) {
          console.error('수식 적용 실패:', error);
          set({
            errors: { 
              ...get().errors, 
              formulaError: error instanceof Error ? error.message : '수식 적용 실패'
            }
          });
        }
      },
      
      // 아티팩트 액션
      setArtifactCode: (code) => set({ artifactCode: code }),
      
      // 아티팩트 히스토리에 추가
      addToArtifactHistory: (artifact) => {
        set((state) => ({
          artifactHistory: [...state.artifactHistory, artifact],
          artifactCode: artifact, // 현재 아티팩트 코드 설정
          activeArtifactId: artifact.messageId || null
        }));
      },
      
      // 아티팩트 히스토리 초기화
      clearArtifactHistory: () => set({ artifactHistory: [] }),
      
      // 모달 액션: 아티팩트 모달 열기
      openArtifactModal: (artifactId) => {
        set((state) => ({
          isArtifactModalOpen: true,
          activeArtifactId: artifactId || state.activeArtifactId
        }));
      },
      
      // 모달 액션: 아티팩트 모달 닫기
      closeArtifactModal: () => {
        set({
          isArtifactModalOpen: false,
          activeArtifactId: null
        });
      },
      
      // 활성 아티팩트 설정
      setActiveArtifact: (artifactId) => {
        const artifact = artifactId ? get().getArtifactById(artifactId) : null;
        set({
          activeArtifactId: artifactId,
          artifactCode: artifact
        });
      },
      
      // 내부 업데이트 플래그 설정
      setInternalUpdate: (flag) => set({ isInternalUpdate: flag }),
      
      // 시트 컨텍스트 업데이트
      updateSheetContext: () => {
        const { rawCsvData } = get();
        if (rawCsvData) {
          set({ sheetContext: generateSheetContext(rawCsvData) });
        }
      },
      
      // 현재 데이터 가져오기 (계산 데이터 또는 원시 데이터)
      getCurrentData: () => {
        const { computedData, rawCsvData } = get();
        if (computedData) return computedData;
        if (rawCsvData) return rawCsvData.data;
        return null;
      },
      
      // ID로 아티팩트 가져오기
      getArtifactById: (id) => {
        const { artifactHistory } = get();
        return artifactHistory.find(artifact => artifact.messageId === id) || null;
      },
      
      // 유틸리티 함수: 셀 주소를 좌표로 변환
      cellAddressToCoords,
      
      // 스토어 전체 초기화
      resetStore: () => {
        set({
          rawCsvData: null,
          computedData: null,
          sheetContext: null,
          loadingStates: {
            fileUpload: false,
            formulaGeneration: false,
            artifactGeneration: false,
          },
          errors: {
            fileError: null,
            formulaError: null,
            artifactError: null,
          },
          pendingFormula: null,
          formulaHistory: [],
          artifactCode: null,
          artifactHistory: [],
          isArtifactModalOpen: false,
          activeArtifactId: null,
          isInternalUpdate: false,
        });
      },
    }),
    { 
      name: 'unified-data-store', // 개발 도구용 스토어 이름
      skipHydration: true // 하이드레이션 건너뛰기
    }
  )
);

// 타입 export
export type { 
  CSVData, 
  SheetContext, 
  HeaderInfo, 
  DataRange, 
  FormulaApplication, 
  ArtifactCode 
};

// 유틸리티 함수 export
export { cellAddressToCoords };