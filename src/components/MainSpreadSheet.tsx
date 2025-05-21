//Src/components/MainSpreadSheet.tsx
'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import Handsontable from 'handsontable';
import { ChevronDown, Layers, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';
import { cellAddressToCoords } from '@/stores/useUnifiedDataStore';
import { XLSXData } from '@/stores/useUnifiedDataStore';

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

// Handsontable z-index 문제 해결을 위한 스타일
import { createGlobalStyle } from 'styled-components';

const HandsontableStyles = createGlobalStyle`
  /* 모달이 열렸을 때 Handsontable의 z-index 조정 */
  .modal-open .handsontable {
    z-index: 0 !important;
  }
  
  .modal-open .ht_master {  
    z-index: 0 !important;
  }
  
  .modal-open .ht_clone_top,
  .modal-open .ht_clone_left,
  .modal-open .ht_clone_top_left_corner,
  .modal-open .ht_clone_bottom,
  .modal-open .ht_clone_bottom_left_corner,
  .modal-open .ht_clone_right {
    z-index: 0 !important;
  }

  /* 시트 선택 드롭다운 스타일 */
  .sheet-selector {
    z-index: 1000;
  }

  .sheet-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    max-height: 240px;
    overflow-y: auto;
    margin-top: 0.5rem;
  }

  .sheet-dropdown-item {
    padding: 0.85rem 1.2rem;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }

  .sheet-dropdown-item:hover {
    background-color: #F9F9F7;
  }

  .sheet-dropdown-item.active {
    background-color: rgba(0, 93, 233, 0.08);
    color: #005DE9;
    font-weight: 500;
  }

  /* 핸즈온테이블 테마 커스터마이징 */
  .handsontable {
    font-family: 'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
  }

  /* 헤더 스타일 */
  .handsontable th {
    background-color: #F9F9F7 !important;
    color: #333 !important;
    font-weight: 600 !important;
    border-color: rgba(0, 0, 0, 0.08) !important;
    padding: 8px !important;
  }

  /* 활성 헤더 스타일 */
  .handsontable th.ht__active_highlight {
    background-color: rgba(0, 93, 233, 0.08) !important;
    color: #005DE9 !important;
  }

  /* 셀 스타일 */
  .handsontable td {
    border-color: rgba(0, 0, 0, 0.05) !important;
    padding: 8px !important;
    transition: background-color 0.2s ease;
  }

  /* 선택된 셀 스타일 */
  .handsontable .ht__selection {
    background-color: rgba(0, 93, 233, 0.16) !important;
  }

  /* 선택된 셀 테두리 */
  .handsontable .ht__selection--highlight {
    border: 2px solid #005DE9 !important;
  }

  /* 행/열 헤더 하이라이트 */
  .handsontable th.ht__highlight {
    background-color: rgba(0, 93, 233, 0.08) !important;
  }

  /* 컨텍스트 메뉴 */
  .handsontable .htContextMenu {
    border-radius: 0.75rem !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
    padding: 0.5rem 0 !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
  }

  .handsontable .htContextMenu .ht_master .wtHolder {
    background-color: white !important;
  }

  .handsontable .htContextMenu table tbody tr td {
    padding: 0.75rem 1.2rem !important;
    border: none !important;
  }

  .handsontable .htContextMenu table tbody tr td:hover {
    background-color: #F9F9F7 !important;
  }

  .handsontable .htContextMenu table tbody tr td.htDisabled:hover {
    background-color: #f8f8f8 !important;
  }

  .handsontable .htContextMenu table tbody tr td.htSeparator {
    height: 1px !important;
    background-color: rgba(0, 0, 0, 0.08) !important;
  }

  /* 포뮬러가 있는 셀 스타일 */
  .handsontable td.formula {
    background-color: rgba(0, 93, 233, 0.05) !important;
  }

  /* 시트 탭 바 스타일 */
  .sheet-tabs-container {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    position: relative;
    background-color: #F9F9F7;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 0 0.5rem;
    flex-grow: 1;
    min-height: 3rem;
    scroll-behavior: smooth;
  }

  .sheet-tabs-container::-webkit-scrollbar {
    display: none;
  }

  .sheet-tab {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.25rem;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 0.5rem 0.5rem 0 0;
    margin-right: 0.25rem;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    position: relative;
    top: 1px;
  }

  .sheet-tab:hover {
    background-color: rgba(0, 93, 233, 0.04);
  }

  .sheet-tab.active {
    background-color: white;
    border-color: rgba(0, 0, 0, 0.08);
    color: #005DE9;
    font-weight: 500;
  }

  .sheet-tab .sheet-info {
    margin-left: 0.5rem;
    padding: 0.125rem 0.5rem;
    font-size: 0.7rem;
    border-radius: 1rem;
    background-color: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.5);
  }

  .sheet-tab.active .sheet-info {
    background-color: rgba(0, 93, 233, 0.08);
    color: rgba(0, 93, 233, 0.7);
  }

  .sheet-add-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    border-radius: 0.5rem 0.5rem 0 0;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    border-bottom: none;
    background-color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    top: 1px;
    min-width: 2.5rem;
    min-height: 2.5rem;
  }

  .sheet-add-button:hover {
    background-color: rgba(0, 93, 233, 0.08);
    border-color: rgba(0, 93, 233, 0.3);
    color: #005DE9;
  }

  .empty-sheet-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    color: rgba(0, 0, 0, 0.5);
    font-size: 0.875rem;
  }

  .empty-sheet-text {
    margin-right: 0.75rem;
  }

  /* 시트 생성 모달 */
  .sheet-create-modal {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.08);
    padding: 1rem;
    width: 300px;
    z-index: 1000;
  }

  .sheet-create-modal input {
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }

  .sheet-create-modal input:focus {
    outline: none;
    border-color: #005DE9;
    box-shadow: 0 0 0 2px rgba(0, 93, 233, 0.2);
  }

  .sheet-create-modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .sheet-create-modal button {
    padding: 0.6rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sheet-create-modal .cancel-button {
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.7);
  }

  .sheet-create-modal .cancel-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .sheet-create-modal .create-button {
    background-color: #005DE9;
    border: 1px solid #005DE9;
    color: white;
  }

  .sheet-create-modal .create-button:hover {
    background-color: #004ab8;
  }

  .sheet-create-modal .create-button:disabled {
    background-color: rgba(0, 93, 233, 0.5);
    cursor: not-allowed;
  }

  /* 가상 스크롤바 */
  .tab-scrollbar-container {
    position: relative;
    height: 8px;
    background-color: #f1f1f1;
    border-radius: 4px;
    margin: 4px 8px 4px 8px;
    cursor: pointer;
    transition: opacity 0.3s;
    opacity: 0.7;
  }

  .tab-scrollbar-container:hover {
    opacity: 1;
  }

  .tab-scrollbar-thumb {
    position: absolute;
    height: 100%;
    background-color: #c1c1c1;
    border-radius: 4px;
    min-width: 30px;
    transition: background-color 0.2s;
  }

  .tab-scrollbar-thumb:hover,
  .tab-scrollbar-thumb.dragging {
    background-color: #a1a1a1;
  }
`;

registerAllModules();

// 공유 HyperFormula 인스턴스 생성
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
  maxRows: 10000,
  maxColumns: 1000,
  useArrayArithmetic: true,  // 배열 연산 활성화
  useColumnIndex: true,       // 열 인덱스 사용 활성화

});

// CSV 데이터가 없을 때의 기본 설정
const defaultData = [
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['', '', '', '', '', ''],
];

// 선택된 셀 정보 인터페이스
interface SelectedCellInfo {
  row: number;
  col: number;
  cellAddress: string;
  value: any;
  formula?: string;
  sheetIndex: number;
  timestamp: Date;
}

const MainSpreadSheet: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [isSheetDropdownOpen, setIsSheetDropdownOpen] = useState(false);
  const [selectedCellInfo, setSelectedCellInfo] = useState<SelectedCellInfo | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isCreateSheetModalOpen, setIsCreateSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  
  // 스크롤바 관련 상태
  const [scrollThumbPosition, setScrollThumbPosition] = useState(0);
  const [scrollThumbWidth, setScrollThumbWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);
  
  // Zustand 스토어 사용 - 확장된 스토어로 변경
  const {
    xlsxData,
    activeSheetData,
    extendedSheetContext,
    loadingStates,
    isInternalUpdate,
    pendingFormula,
    computedSheetData,
    updateActiveSheetCell,
    setComputedDataForSheet,
    setInternalUpdate,
    setPendingFormula,
    getCurrentSheetData,
    switchToSheet,
    coordsToSheetReference,
    setLoadingState,
    setXLSXData
  } = useExtendedUnifiedDataStore();

  const [isAutosave] = useState<boolean>(false);

  // HyperFormula 설정
  const [formulasConfig] = useState<DetailedSettings>({
    engine: hyperformulaInstance,
    namedExpressions: [],
    sheetName: extendedSheetContext?.sheetName || 'Sheet1',
  });

  // 표시할 데이터 준비 - 활성 시트 데이터 사용
  const displayData = useMemo(() => {
    if (!activeSheetData) return defaultData;
    
    const currentData = getCurrentSheetData();
    const data = [activeSheetData.headers, ...(currentData || activeSheetData.data)];
    return data;
  }, [activeSheetData, getCurrentSheetData]);

  // 시트 전환 핸들러
  const handleSheetChange = useCallback(async (sheetIndex: number) => {
    setLoadingState('sheetSwitch', true);
    try {
      await switchToSheet(sheetIndex);
      setIsSheetDropdownOpen(false);
      
      // 시트 전환 시 선택된 셀 정보 초기화
      setSelectedCellInfo(null);
      
      // Handsontable 인스턴스 재렌더링
      setTimeout(() => {
        hotRef.current?.hotInstance?.render();
      }, 100);
    } catch (error) {
      console.error('Sheet switch error:', error);
    } finally {
      setLoadingState('sheetSwitch', false);
    }
  }, [switchToSheet, setLoadingState]);

  // 셀 선택 핸들러
  const handleCellSelection = useCallback((row: number, col: number) => {
    if (!hotRef.current?.hotInstance || !xlsxData || !activeSheetData) return;

    const hot = hotRef.current.hotInstance;
    
    // 헤더 행 제외한 실제 데이터 행
    const dataRow = row - 1;
    let value = '';
    let formula = '';

    try {
      // 셀 값 가져오기
      value = hot.getDataAtCell(row, col) || '';
      
      // 수식 확인 (수식이 있는 경우)
      const formulasPlugin = hot.getPlugin('formulas');
      if (formulasPlugin && formulasPlugin.engine) {
        const cellCoord = { row, col, sheet: 0 };
        const cellValue = formulasPlugin.engine.getCellValue(cellCoord);
        const cellFormula = formulasPlugin.engine.getCellFormula(cellCoord);
        
        if (cellFormula && cellFormula.startsWith('=')) {
          formula = cellFormula;
        }
      }

      // 셀 주소 계산 (A1, B2 등)
      const colLetter = String.fromCharCode(65 + col);
      const cellAddress = `${colLetter}${row + 1}`;

      // 시트 참조 포함된 주소
      const fullReference = coordsToSheetReference(
        xlsxData.activeSheetIndex,
        dataRow >= 0 ? dataRow : 0,
        col
      );

      const cellInfo: SelectedCellInfo = {
        row: dataRow >= 0 ? dataRow : row,
        col,
        cellAddress,
        value,
        formula: formula || undefined,
        sheetIndex: xlsxData.activeSheetIndex,
        timestamp: new Date()
      };

      setSelectedCellInfo(cellInfo);
      
      console.log('Selected cell:', {
        address: cellAddress,
        fullReference,
        value,
        formula: formula || 'none',
        sheetName: activeSheetData.sheetName
      });
    } catch (error) {
      console.error('Error getting cell info:', error);
    }
  }, [xlsxData, activeSheetData, coordsToSheetReference]);

  // 포뮬러 적용
  useEffect(() => {
    if (pendingFormula && hotRef.current?.hotInstance) {
      setInternalUpdate(true);
      
      // 다중 시트 포뮬러라면 해당 시트의 포뮬러인지 확인
      const targetSheetIndex = pendingFormula.sheetIndex ?? xlsxData?.activeSheetIndex ?? 0;
      
      if (targetSheetIndex === xlsxData?.activeSheetIndex) {
        applyFormulaToCell(pendingFormula.formula, pendingFormula.cellAddress);
        
        // 포뮬러 적용 후 계산된 결과를 스토어에 반영
        setTimeout(() => {
          const hot = hotRef.current?.hotInstance;
          if (hot && xlsxData) {
            const evaluatedData = hot.getData();
            // 헤더 행 제외하고 데이터만 저장
            setComputedDataForSheet(xlsxData.activeSheetIndex, evaluatedData.slice(1));
          }
          setPendingFormula(null);
          setInternalUpdate(false);
        }, 200);
      } else {
        // 다른 시트의 포뮬러는 그 시트로 전환 후 적용
        setPendingFormula(null);
        setInternalUpdate(false);
      }
    }
  }, [pendingFormula, setPendingFormula, setInternalUpdate, setComputedDataForSheet, xlsxData]);

  // 셀에 함수를 적용하는 함수
  const applyFormulaToCell = (formula: string, cellAddress: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) {
      console.error('Handsontable instance not available');
      return;
    }

    try {
      // 셀 주소를 좌표로 변환
      const { row, col } = cellAddressToCoords(cellAddress);
      
      console.log(`Applying formula "${formula}" to cell ${cellAddress} (${row}, ${col})`);
      
      // 수식이 = 로 시작하는지 확인하고, 그렇지 않으면 자동으로 추가
      const formulaValue = formula.startsWith('=') ? formula : `=${formula}`;
      
      // 직접 셀에 함수 설정 (헤더 행 때문에 row + 1)
      hot.setDataAtCell(row + 1, col, formulaValue);
      
      // 강제 재렌더링 및 계산
      setTimeout(() => {
        hot.render();
        console.log('Formula applied successfully');
      }, 100);
    } catch (error) {
      console.error('Error applying formula:', error);
      
      // 오류 발생 시 대안으로 네임드 익스프레션 사용 시도
      tryNamedExpressionApproach(formula, cellAddress);
    }
  };

  // 네임드 익스프레션을 사용한 대안 접근법
  const tryNamedExpressionApproach = (formula: string, cellAddress: string) => {
    const hot = hotRef.current?.hotInstance;
    const formulasPlugin = hot?.getPlugin('formulas');
    
    if (!formulasPlugin?.engine) {
      console.error('Formulas engine not available');
      return;
    }

    try {
      // 고유한 네임드 익스프레션 이름 생성
      const namedExpName = `FORMULA_${Date.now()}`;
      
      // 네임드 익스프레션 추가
      formulasPlugin.engine.addNamedExpression(namedExpName, formula);
      
      // 셀에 네임드 익스프레션 참조 설정 (헤더 행 때문에 row + 1)
      const { row, col } = cellAddressToCoords(cellAddress);
      hot?.setDataAtCell(row + 1, col, `=${namedExpName}`);
      
      // 재렌더링
      hot?.render();
      
      console.log(`Applied formula using named expression: ${namedExpName}`);
    } catch (error) {
      console.error('Named expression approach also failed:', error);
    }
  };

  // 새 시트 생성 핸들러
  const handleCreateSheet = () => {
    if (!newSheetName.trim()) return;
    
    // 기본 빈 데이터로 새 시트 생성
    const emptyData = Array(20).fill(Array(6).fill(''));
    const emptyHeaders = Array(6).fill('');
    
    if (xlsxData) {
      // 기존 xlsxData가 있는 경우 새 시트 추가
      // 중복되는 시트명 확인
      const existingNames = xlsxData.sheets.map(s => s.sheetName);
      let uniqueName = newSheetName;
      let counter = 1;
      
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${newSheetName} ${counter}`;
        counter++;
      }
      
      // 새 시트 데이터 생성
      const newSheet = {
        sheetName: uniqueName,
        headers: emptyHeaders,
        data: emptyData,
        metadata: {
          rowCount: emptyData.length,
          columnCount: emptyHeaders.length,
          headerRow: 0,
          dataRange: {
            startRow: 0,
            endRow: emptyData.length - 1,
            startCol: 0,
            endCol: emptyHeaders.length - 1,
            startColLetter: 'A',
            endColLetter: String.fromCharCode(65 + emptyHeaders.length - 1)
          },
          lastModified: new Date()
        }
      };
      
      // 새 xlsxData 생성하여 적용
      const newXlsxData = { ...xlsxData };
      newXlsxData.sheets = [...newXlsxData.sheets, newSheet];
      const newSheetIndex = newXlsxData.sheets.length - 1;
      
      // 상태 업데이트
      setXLSXData(newXlsxData);
      
      // 새 시트로 전환
      setTimeout(() => {
        switchToSheet(newSheetIndex);
      }, 100);
    } else {
      // xlsxData가 없는 경우 새로 생성
      const newXlsxData: XLSXData = {
        fileName: 'new_spreadsheet.xlsx',
        sheets: [
          {
            sheetName: newSheetName,
            headers: emptyHeaders,
            data: emptyData,
            metadata: {
              rowCount: emptyData.length,
              columnCount: emptyHeaders.length,
              headerRow: 0,
              dataRange: {
                startRow: 0,
                endRow: emptyData.length - 1,
                startCol: 0,
                endCol: emptyHeaders.length - 1,
                startColLetter: 'A',
                endColLetter: 'F'
              }
            }
          }
        ],
        activeSheetIndex: 0
      };
      
      setXLSXData(newXlsxData);
    }
    
    // 모달 상태 초기화
    setNewSheetName('');
    setIsCreateSheetModalOpen(false);
  };

  // 모달 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const modalElement = document.querySelector('.sheet-create-modal');
      const addButton = document.querySelector('.sheet-add-button');
      
      if (
        isCreateSheetModalOpen && 
        modalElement && 
        !modalElement.contains(target) && 
        addButton && 
        !addButton.contains(target)
      ) {
        setIsCreateSheetModalOpen(false);
        setNewSheetName('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreateSheetModalOpen]);

  // 스크롤바 관련 이벤트 핸들러
  useEffect(() => {
    const checkScroll = () => {
      const container = tabsContainerRef.current;
      if (!container) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth;
      
      // 스크롤바 표시 여부 설정
      setShowScrollbar(hasHorizontalScroll);
      
      // 스크롤바 thumb 위치와 너비 계산
      if (hasHorizontalScroll) {
        const thumbWidth = Math.max(30, (clientWidth / scrollWidth) * clientWidth);
        setScrollThumbWidth(thumbWidth);
        
        const maxScrollPosition = scrollWidth - clientWidth;
        const scrollPercentage = maxScrollPosition > 0 ? scrollLeft / maxScrollPosition : 0;
        const maxThumbPosition = clientWidth - thumbWidth;
        const thumbPosition = scrollPercentage * maxThumbPosition;
        
        setScrollThumbPosition(thumbPosition);
      }
    };
    
    // 초기 체크
    checkScroll();
    
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [xlsxData?.sheets.length]);
  
  // 가상 스크롤바 클릭 핸들러
  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tabsContainerRef.current;
    if (!container) return;
    
    const scrollbarElement = e.currentTarget;
    const rect = scrollbarElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // 클릭한 위치로 thumb 이동
    const scrollPercentage = clickX / rect.width;
    const scrollPosition = scrollPercentage * (container.scrollWidth - container.clientWidth);
    
    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  };
  
  // 드래그 시작 핸들러
  const handleThumbDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    
    const container = tabsContainerRef.current;
    if (container) {
      setDragStartScroll(container.scrollLeft);
    }
    
    // 글로벌 이벤트 리스너 추가
    document.addEventListener('mousemove', handleThumbDrag);
    document.addEventListener('mouseup', handleThumbDragEnd);
  };
  
  // 드래그 중 핸들러
  const handleThumbDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = tabsContainerRef.current;
    if (!container) return;
    
    const deltaX = e.clientX - dragStartX;
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    
    const maxScrollPosition = scrollWidth - containerWidth;
    const dragRatio = containerWidth / scrollWidth;
    const scrollDelta = deltaX / dragRatio;
    
    container.scrollLeft = Math.max(0, Math.min(maxScrollPosition, dragStartScroll + scrollDelta));
  }, [isDragging, dragStartX, dragStartScroll]);
  
  // 드래그 종료 핸들러
  const handleThumbDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // 글로벌 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleThumbDrag);
    document.removeEventListener('mouseup', handleThumbDragEnd);
  }, [handleThumbDrag]);
  
  // 스크롤 이벤트 핸들러 등록 및 해제
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbDragEnd);
    };
  }, [handleThumbDrag, handleThumbDragEnd]);

  // 로딩 중일 때 표시
  if (loadingStates.fileUpload) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">파일을 처리하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Handsontable z-index 문제 해결을 위한 스타일 */}
      <HandsontableStyles />
      
      {/* 상단 컨트롤 패널 */}
      <div className="example-controls-container bg-[#F9F9F7] border-b border-gray-200 p-2 shadow-sm">
        <div className="flex items-center justify-between">
          {/* 선택된 셀 정보 표시 */}
          {selectedCellInfo && (
            <div className="flex items-center space-x-4 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                {/* <span className="font-medium">셀:</span> */}
                <span className="font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                  {selectedCellInfo.cellAddress}
                </span>
              </div>
              {selectedCellInfo.formula && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">수식:</span>
                  <span className="font-mono bg-[rgba(0,93,233,0.08)] px-2.5 py-1.5 rounded-lg text-[#005DE9] border border-[rgba(0,93,233,0.2)]">
                    {selectedCellInfo.formula}
                  </span>
                </div>
              )}
              {!selectedCellInfo.formula && selectedCellInfo.value && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">값:</span>
                  <span className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                    {selectedCellInfo.value.toString().length > 30 
                      ? `${selectedCellInfo.value.toString().substring(0, 30)}...`
                      : selectedCellInfo.value.toString()
                    }
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 포뮬러 적용 대기 알림 */}
        {pendingFormula && (
          <div className="bg-[rgba(0,93,233,0.08)] border border-[rgba(0,93,233,0.2)] rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#005DE9]">
                  포뮬러 적용 대기 중
                </p>
                <p className="text-xs text-[rgba(0,93,233,0.8)] mt-1.5">
                  {pendingFormula.cellAddress}에 {pendingFormula.formula} 적용
                  {pendingFormula.sheetIndex !== undefined && 
                    ` (시트 ${xlsxData?.sheets[pendingFormula.sheetIndex]?.sheetName || pendingFormula.sheetIndex})`
                  }
                </p>
              </div>
              <button
                onClick={() => setPendingFormula(null)}
                className="text-[#005DE9] hover:text-[#004ab8] text-sm bg-white px-3 py-1.5 rounded-lg border border-[rgba(0,93,233,0.2)] transition-colors duration-200"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 시트 탭 바 - 항상 표시 */}
      <div className="relative">
        <div className="flex flex-col bg-[#F9F9F7]">
          <div className="flex items-center border-b border-gray-200">
            {/* 시트 탭 컨테이너 - 시트 있을 때와 없을 때 모두 표시 */}
            <div ref={tabsContainerRef} className="sheet-tabs-container">
              {xlsxData && xlsxData.sheets.length > 0 ? (
                /* 시트가 있는 경우 시트 탭 표시 */
                xlsxData.sheets.map((sheet, index) => (
                  <div
                    key={index}
                    onClick={() => handleSheetChange(index)}
                    className={`sheet-tab ${index === xlsxData.activeSheetIndex ? 'active' : ''}`}
                  >
                    <span>{sheet.sheetName}</span>
                    <span className="sheet-info">
                      {sheet.headers.length}×{sheet.data.length}
                    </span>
                  </div>
                ))
              ) : (
                /* 시트가 없는 경우 안내 메시지 표시 */
                <div className="empty-sheet-container">
                  <span className="empty-sheet-text">시트가 없습니다. 새 시트를 추가하세요</span>
                </div>
              )}
            </div>
            
            {/* 시트 추가 버튼 - 항상 같은 위치에 표시 */}
            <div className="relative">
              <button 
                className="sheet-add-button" 
                onClick={() => setIsCreateSheetModalOpen(true)}
                aria-label="새 시트 추가"
              >
                <Plus size={18} />
              </button>
              
              {isCreateSheetModalOpen && (
                <div className="sheet-create-modal">
                  <h3 className="text-base font-medium mb-3">새 시트 만들기</h3>
                  <input
                    type="text"
                    placeholder="시트 이름"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    autoFocus
                  />
                  <div className="sheet-create-modal-buttons">
                    <button
                      className="cancel-button"
                      onClick={() => {
                        setIsCreateSheetModalOpen(false);
                        setNewSheetName('');
                      }}
                    >
                      취소
                    </button>
                    <button
                      className="create-button"
                      onClick={handleCreateSheet}
                      disabled={!newSheetName.trim()}
                    >
                      만들기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 간단한 브라우저 스타일 스크롤바 */}
          {showScrollbar && (
            <div 
              className="tab-scrollbar-container"
              onClick={handleScrollbarClick}
            >
              <div 
                className={`tab-scrollbar-thumb ${isDragging ? 'dragging' : ''}`}
                style={{ 
                  width: `${scrollThumbWidth}px`,
                  left: `${scrollThumbPosition}px`
                }}
                onMouseDown={handleThumbDragStart}
              />
            </div>
          )}
        </div>
        
        {/* 로딩 상태 표시 */}
        {loadingStates.sheetSwitch && (
          <div className="absolute top-full left-0 right-0 mt-1 flex items-center justify-center py-2 bg-white shadow-sm z-10">
            <div className="w-4 h-4 border-2 border-[#005DE9] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-xs text-gray-600">시트 전환 중...</span>
          </div>
        )}
      </div>

      {/* 스프레드시트 영역 */}
      <div className="flex-1 overflow-auto bg-white shadow-inner">
        <HotTable
          ref={hotRef}
          rowHeaders={true}
          colHeaders={true}
          height="100%"
          autoWrapRow={true}
          autoWrapCol={true}
          minRows={8}
          minCols={activeSheetData?.headers.length || 6}
          minSpareCols={5}
          minSpareRows={3}
          manualColumnResize={true}
          manualRowResize={true}
          persistentState={true}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          wordWrap={true}
          readOnly={false}
          columnSorting={false}
          filters={true}
          contextMenu={true}
          dropdownMenu={true}
          data={displayData}
          formulas={formulasConfig}
          language="ko-Kr"
          afterChange={(
            changes: Handsontable.CellChange[] | null,
            source: Handsontable.ChangeSource
          ) => {
            // 내부 업데이트이거나 로드 시점이면 스킵
            if (isInternalUpdate || source === 'loadData') {
              return;
            }

            // 사용자 변경사항을 스토어에 반영
            if (changes && activeSheetData) {
              changes.forEach(([row, col, , newValue]) => {
                if (typeof row === 'number' && typeof col === 'number') {
                  // 헤더 행 제외 (헤더가 첫 번째 행에 있으므로)
                  const dataRow = row - 1;
                  if (dataRow >= 0) {
                    updateActiveSheetCell(dataRow, col, newValue?.toString() || '');
                  }
                }
              });
            }

            if (!isAutosave) {
              return;
            }
          }}
          // 셀 선택 이벤트 처리
          afterSelection={(row, col) => {
            handleCellSelection(row, col);
          }}
          afterSelectionEnd={(row, col) => {
            handleCellSelection(row, col);
          }}
          // 셀 값 변경 후 포뮬러 업데이트 훅
          afterSetDataAtCell={() => {
            console.log('Data set, recalculating formulas...');
            
            // 100ms 후에 재렌더링 (포뮬러가 계산될 시간을 줌)
            setTimeout(() => {
              hotRef.current?.hotInstance?.render();
            }, 100);
          }}
        />
      </div>
    </div>
  );
};

export default MainSpreadSheet;