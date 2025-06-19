import Handsontable from 'handsontable';
import { HotTableRef } from '@handsontable/react-wrapper';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import { SheetData } from '@/stores/store-types';

interface HotSettingsProps {
  activeSheetData: SheetData | null;
  formulasConfig: DetailedSettings;
  isInternalUpdate: boolean;
  handleAfterChange: (changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => void;
  handleCellSelection: (row: number, col: number) => void;
  hotRef: React.RefObject<HotTableRef>;
}

const getSizingSettings = (activeSheetData: SheetData | null) => {
  console.log('📏 getSizingSettings 호출:', {
    hasActiveSheetData: !!activeSheetData,
    hasRawData: !!(activeSheetData?.rawData),
    rawDataLength: activeSheetData?.rawData?.length || 0,
    firstRowLength: activeSheetData?.rawData?.[0]?.length || 0
  });

  // 동적으로 데이터 크기에 맞춰 설정
  if (activeSheetData?.rawData && activeSheetData.rawData.length > 0) {
    const rawRows = activeSheetData.rawData.length;
    const rawCols = Math.max(0, ...activeSheetData.rawData.map(row => (row || []).length));
    
    // 데이터보다 충분한 여백 제공
    const calculatedRows = Math.max(100, rawRows + 50);
    const calculatedCols = Math.max(26, rawCols + 10);
    
    console.log('📏 동적 크기 계산:', {
      rawRows,
      rawCols,
      calculatedRows,
      calculatedCols
    });
    
    return {
      minRows: calculatedRows,
      minCols: calculatedCols,
      startRows: calculatedRows,
      startCols: calculatedCols,
      maxRows: 10000,
      maxCols: 1000,
      minSpareRows: 50,
      minSpareCols: 10
    };
  }
  
  // 기본값 (데이터가 없을 때)
  console.log('📏 기본 크기 설정 사용');
  return {
    minRows: 100,
    minCols: 26,
    startRows: 100,
    startCols: 26,
    maxRows: 10000,
    maxCols: 1000,
    minSpareRows: 50,
    minSpareCols: 10
  };
};

export const getHotTableSettings = ({
  activeSheetData,
  formulasConfig,
  isInternalUpdate,
  handleAfterChange,
  handleCellSelection,
  hotRef,
}: HotSettingsProps): Handsontable.GridSettings => {
  return {
    // ===== 기본 레이아웃 설정 =====
    rowHeaders: true,
    colHeaders: true,
    height: "100%",
    width: "100%",

    // ===== 사이징 설정 (동적 계산) =====
    ...getSizingSettings(activeSheetData),

    // ===== 성능 최적화 설정 =====
    renderAllRows: false,
    renderAllColumns: false,
    viewportRowRenderingOffset: 10, // 30에서 10으로 최적화
    viewportColumnRenderingOffset: 2, // 10에서 2로 최적화
    viewportRowRenderingThreshold: 50,
    viewportColumnRenderingThreshold: 20,

    // 자동 크기 계산 비활성화 (성능 향상)
    autoRowSize: false,
    autoColumnSize: false,

    // ===== 엑셀과 같은 수동 크기 조정 =====
    manualColumnResize: true, // 컬럼 헤더 경계선 드래그로 너비 조정
    manualRowResize: true,    // 행 헤더 경계선 드래그로 높이 조정

    // 고정 크기 설정 (기본값, 사용자가 수동으로 변경 가능)
    colWidths: 100,
    rowHeights: 23,

    // ===== UX 개선 설정 =====
    autoWrapRow: false, // 의도치 않은 랩핑 방지
    autoWrapCol: false, // 의도치 않은 랩핑 방지

    // 선택 및 네비게이션 개선
    selectionMode: 'multiple',
    tabMoves: { row: 0, col: 1 }, // 탭으로 다음 셀로 이동
    enterMoves: { row: 1, col: 0 }, // 엔터로 아래 셀로 이동

    // 외부 클릭 처리
    outsideClickDeselects: true,

    // ===== 메모리 최적화 =====
    observeDOMVisibility: true, // DOM 가시성 관찰로 메모리 최적화

    // ===== 기본 기능들 =====
    readOnly: false,
    fillHandle: true,
    stretchH: "none", // "all"에서 "none"으로 변경하여 열 너비 제한 해제

    // 행/열 관리
    allowInsertRow: true,
    allowInsertColumn: true,
    allowRemoveRow: true,
    allowRemoveColumn: true,

    // 컨텍스트 메뉴
    // 컨텍스트 메뉴 설정 개선
    contextMenu: {
      items: {
        'row_above': {
          name: '위에 행 삽입'
        },
        'row_below': {
          name: '아래에 행 삽입'
        },
        'hsep1': '---------',
        'col_left': {
          name: '왼쪽에 열 삽입'
        },
        'col_right': {
          name: '오른쪽에 열 삽입'
        },
        'hsep2': '---------',
        'remove_row': {
          name: '행 삭제'
        },
        'remove_col': {
          name: '열 삭제'
        },
        'hsep3': '---------',
        'undo': {
          name: '실행 취소'
        },
        'redo': {
          name: '다시 실행'
        },
        'hsep4': '---------',
        'make_read_only': {
          name: '읽기 전용으로 설정'
        },
        'hsep5': '---------',
        'alignment': {
          name: '정렬',
          submenu: {
            items: [
              { key: 'alignment:left', name: '왼쪽 정렬' },
              { key: 'alignment:center', name: '가운데 정렬' },
              { key: 'alignment:right', name: '오른쪽 정렬' }
            ]
          }
        },
        'hsep6': '---------',
        'copy': {
          name: '복사'
        },
        'cut': {
          name: '잘라내기'
        }
      }
    },
    // 실행 취소/다시 실행
    undo: true,

    // 클립보드 설정
    copyPaste: true,

    // 워드 랩 비활성화 (성능 향상)
    wordWrap: false,

    // 오버플로우 방지 제거 (모든 열을 표시하기 위해)
    // preventOverflow: 'horizontal', // 주석 처리하여 수평 스크롤 허용

    // ===== 라이센스 =====
    licenseKey: "non-commercial-and-evaluation",

    // ===== 포뮬러 설정 =====
    formulas: formulasConfig,

    // ===== 이벤트 핸들러들 =====
    beforeChange: (changes, source) => {
      if (!isInternalUpdate && changes && source !== 'loadData') {
        console.log('Data changing:', changes, 'Source:', source);
      }
    },

    afterChange: handleAfterChange,

    afterSelection: (row, col) => {
      handleCellSelection(row, col);
    },

    afterSelectionEnd: (row, col) => {
      handleCellSelection(row, col);
    },

    afterSetDataAtCell: () => {
      console.log('Data set, recalculating formulas...');
      setTimeout(() => {
        const currentHot = hotRef.current?.hotInstance;
        if (currentHot && !currentHot.isDestroyed) {
          try {
            currentHot.render();
          } catch (error) {
            console.warn('afterSetDataAtCell 렌더링 중 오류 (무시됨):', error);
          }
        }
      }, 50); // 100ms에서 50ms로 단축
    },

    afterCreateRow: (index, amount) => {
      console.log(`Added ${amount} rows at index ${index}`);
    },

    afterCreateCol: (index, amount) => {
      console.log(`Added ${amount} columns at index ${index}`);
    },
  };
};