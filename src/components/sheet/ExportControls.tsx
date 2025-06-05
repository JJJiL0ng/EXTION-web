import React from 'react';
import { FileDown } from 'lucide-react';
import { ExportState } from './types';
import { XLSXData, SheetData } from '@/stores/store-types';

interface ExportControlsProps {
  exportState: ExportState;
  xlsxData: XLSXData | null;
  activeSheetData: SheetData | null;
  onExportToCSV: () => void;
  onExportToXLSX: () => void;
  onToggleExportDropdown: () => void;
  onToggleXlsxSelector: () => void;
  onToggleSheetSelection: (sheetIndex: number) => void;
  onToggleAllSheets: () => void;
  onExecuteXlsxExport: () => void;
  onSetExportFileName: (fileName: string) => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  exportState,
  xlsxData,
  activeSheetData,
  onExportToCSV,
  onExportToXLSX,
  onToggleExportDropdown,
  onToggleXlsxSelector,
  onToggleSheetSelection,
  onToggleAllSheets,
  onExecuteXlsxExport,
  onSetExportFileName
}) => {
  const {
    isExportDropdownOpen,
    isXlsxSelectorOpen,
    selectedSheets,
    exportFileName
  } = exportState;

  return (
    <div className="relative ml-auto" style={{ zIndex: 9999 }}>
      <button
        className="export-button flex items-center space-x-1.5 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm transition-colors duration-200"
        onClick={onToggleExportDropdown}
        type="button"
        style={{
          borderColor: '#005DE9',
          color: '#005DE9'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 93, 233, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <FileDown size={16} />
        <span>내보내기</span>
      </button>

      {/* 내보내기 드롭다운 */}
      {isExportDropdownOpen && (
        <div className="export-dropdown absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50 min-w-[180px]" style={{ zIndex: 9999 }}>
          <div className="py-1">
            <button
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2 text-sm"
              onClick={onExportToCSV}
              disabled={!activeSheetData}
              type="button"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 93, 233, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>CSV로 내보내기</span>
              <span className="text-xs text-gray-500">(현재 시트)</span>
            </button>
            <button
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2 text-sm"
              onClick={onExportToXLSX}
              disabled={!xlsxData}
              type="button"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 93, 233, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>XLSX로 내보내기</span>
              <span className="text-xs text-gray-500">(모든/선택 시트)</span>
            </button>
          </div>
        </div>
      )}

      {/* XLSX 시트 선택기 */}
      {isXlsxSelectorOpen && xlsxData && (
        <div className="xlsx-sheet-selector absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 min-w-[300px]" style={{ zIndex: 9999 }}>
          <div className="p-4">
            <h3 className="font-medium text-gray-800 mb-3">내보낼 시트 선택</h3>

            {/* 파일명 입력 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">파일명</label>
              <input
                type="text"
                value={exportFileName}
                onChange={(e) => onSetExportFileName(e.target.value)}
                placeholder="파일명 입력 (확장자 제외)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{
                  '--tw-ring-color': '#005DE9'
                } as React.CSSProperties}
                onFocusCapture={(e) => {
                  e.target.style.borderColor = '#005DE9';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0, 93, 233, 0.2)';
                }}
                onBlurCapture={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 시트 선택 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-gray-600">시트</label>
                <button
                  className="text-xs hover:underline transition-colors duration-200"
                  onClick={onToggleAllSheets}
                  type="button"
                  style={{ color: '#005DE9' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#004ab8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#005DE9';
                  }}
                >
                  {selectedSheets.length === xlsxData.sheets.length ? '모두 해제' : '모두 선택'}
                </button>
              </div>

              <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-md divide-y">
                {xlsxData.sheets.map((sheet, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2.5 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`sheet-${index}`}
                      checked={selectedSheets.includes(index)}
                      onChange={() => onToggleSheetSelection(index)}
                      className="mr-2.5"
                      style={{
                        accentColor: '#005DE9'
                      }}
                    />
                    <label
                      htmlFor={`sheet-${index}`}
                      className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{sheet.sheetName}</span>
                      <span className="text-xs text-gray-500">
                        {sheet.headers.length}×{sheet.data.length}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                onClick={onToggleXlsxSelector}
                type="button"
              >
                취소
              </button>
              <button
                className="px-3 py-1.5 text-white rounded-md text-sm transition-colors"
                onClick={onExecuteXlsxExport}
                disabled={selectedSheets.length === 0}
                type="button"
                style={{
                  backgroundColor: '#005DE9'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#004ab8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#005DE9';
                  }
                }}
              >
                내보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls; 