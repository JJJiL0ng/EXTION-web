import React, { useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { SheetTabsState } from './types';
import { XLSXData } from '@/stores/store-types';

interface SheetTabsProps {
  xlsxData: XLSXData | null;
  sheetTabsState: SheetTabsState;
  onSheetChange: (sheetIndex: number) => void;
  onCreateSheet: () => void;
  onSetNewSheetName: (name: string) => void;
  onToggleCreateSheetModal: () => void;
  onScrollbarClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onThumbDragStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  loadingStates: { sheetSwitch: boolean };
}

const SheetTabs: React.FC<SheetTabsProps> = ({
  xlsxData,
  sheetTabsState,
  onSheetChange,
  onCreateSheet,
  onSetNewSheetName,
  onToggleCreateSheetModal,
  onScrollbarClick,
  onThumbDragStart,
  loadingStates
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const {
    isCreateSheetModalOpen,
    newSheetName,
    scrollThumbPosition,
    scrollThumbWidth,
    isDragging,
    showScrollbar
  } = sheetTabsState;

  return (
    <div className="relative flex-shrink-0" style={{ zIndex: 8000 }}>
      <div className="flex flex-col bg-[#F9F9F7]">
        <div className="flex items-center border-gray-200">
          {/* 시트 탭 컨테이너 - 시트 있을 때와 없을 때 모두 표시 */}
          <div ref={tabsContainerRef} className="sheet-tabs-container">
            {xlsxData && xlsxData.sheets.length > 0 ? (
              /* 시트가 있는 경우 시트 탭 표시 */
              xlsxData.sheets.map((sheet, index) => (
                <div
                  key={index}
                  onClick={() => onSheetChange(index)}
                  className={`sheet-tab ${index === xlsxData.activeSheetIndex ? 'active' : ''}`}
                >
                  <span>{sheet.sheetName}</span>
                  <span className="sheet-info">
                    {sheet.headers.length}×{sheet.data.length}
                  </span>
                </div>
              ))
            ) : (
              /* 시트가 없는 경우 기본 시트 탭 표시 */
              <div className="sheet-tab active">
                <span>Sheet1</span>
                <span className="sheet-info">
                  26×100
                </span>
              </div>
            )}
          </div>

          {/* 시트 추가 버튼 - 주석처리됨 */}
          {/* <div className="relative">
            <button
              className="sheet-add-button"
              onClick={onToggleCreateSheetModal}
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
                  onChange={(e) => onSetNewSheetName(e.target.value)}
                  autoFocus
                />
                <div className="sheet-create-modal-buttons">
                  <button
                    className="cancel-button"
                    onClick={onToggleCreateSheetModal}
                  >
                    취소
                  </button>
                  <button
                    className="create-button"
                    onClick={onCreateSheet}
                    disabled={!newSheetName.trim()}
                  >
                    만들기
                  </button>
                </div>
              </div>
            )}
          </div> */}
        </div>

        {/* 간단한 브라우저 스타일 스크롤바 */}
        {showScrollbar && (
          <div
            className="tab-scrollbar-container"
            onClick={onScrollbarClick}
          >
            <div
              className={`tab-scrollbar-thumb ${isDragging ? 'dragging' : ''}`}
              style={{
                width: `${scrollThumbWidth}px`,
                left: `${scrollThumbPosition}px`
              }}
              onMouseDown={onThumbDragStart}
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
  );
};

export default SheetTabs; 