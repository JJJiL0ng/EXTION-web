'use client';

import { useRef, useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { AdminSheetTableData } from '@/stores/adminStore';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { FileSpreadsheet, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import 'handsontable/dist/handsontable.full.min.css';

// Handsontable 모듈 등록
registerAllModules();

export default function AdminSheetRender() {
  const { sheetMetaData } = useAdminStore();
  const hotTableRef = useRef<HotTable>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [isSheetListOpen, setIsSheetListOpen] = useState(false);
  const [sheetStats, setSheetStats] = useState<{
    rows: number;
    cols: number;
    nonEmptyCells: number;
  }>({ rows: 0, cols: 0, nonEmptyCells: 0 });

  // 현재 선택된 시트 데이터
  const currentSheetData = sheetMetaData?.sheetTableData?.[selectedSheetIndex];

  // 시트 데이터 변경 시 통계 업데이트
  useEffect(() => {
    if (currentSheetData?.data) {
      const data = currentSheetData.data;
      const rows = data.length;
      const cols = data[0]?.length || 0;
      let nonEmptyCells = 0;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (data[i][j] !== null && data[i][j] !== undefined && data[i][j] !== '') {
            nonEmptyCells++;
          }
        }
      }

      setSheetStats({ rows, cols, nonEmptyCells });
    }
  }, [currentSheetData]);

  // 시트 메타데이터 변경 시 활성 시트 인덱스 설정
  useEffect(() => {
    if (sheetMetaData?.activeSheetIndex !== undefined) {
      setSelectedSheetIndex(sheetMetaData.activeSheetIndex);
    }
  }, [sheetMetaData?.activeSheetIndex]);

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '알 수 없음';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!sheetMetaData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">시트 데이터가 없습니다</h3>
          <p className="text-sm text-gray-400">시트 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!sheetMetaData.sheetTableData || sheetMetaData.sheetTableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">시트 테이블 데이터가 없습니다</h3>
          <p className="text-sm text-gray-400">이 시트에는 테이블 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 시트 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {sheetMetaData.fileName || '제목 없음'}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>시트 ID: {sheetMetaData.id}</span>
              <span>사용자 ID: {sheetMetaData.userId}</span>
              <span>파일 크기: {formatFileSize(sheetMetaData.fileSize)}</span>
              <span>파일 형식: {sheetMetaData.fileType || 'xlsx'}</span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>생성: {formatTimestamp(sheetMetaData.createdAt)}</div>
            <div>수정: {formatTimestamp(sheetMetaData.updatedAt)}</div>
          </div>
        </div>

        {/* 시트 선택 및 통계 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 시트 선택 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsSheetListOpen(!isSheetListOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {currentSheetData?.name || `시트 ${selectedSheetIndex + 1}`}
                </span>
                {isSheetListOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isSheetListOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[200px]">
                  {sheetMetaData.sheetTableData.map((sheet, index) => (
                    <button
                      key={sheet.id}
                      onClick={() => {
                        setSelectedSheetIndex(index);
                        setIsSheetListOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                        index === selectedSheetIndex ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <div className="font-medium">{sheet.name}</div>
                      <div className="text-xs text-gray-500">
                        인덱스: {sheet.index} | 생성: {formatTimestamp(sheet.createdAt)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 시트 통계 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>
                {sheetStats.rows} 행 × {sheetStats.cols} 열 | 데이터 셀: {sheetStats.nonEmptyCells}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 시트 테이블 영역 */}
      <div className="flex-1 overflow-hidden p-4">
        {currentSheetData?.data ? (
          <div className="h-full">
            <HotTable
              ref={hotTableRef}
              data={currentSheetData.data}
              colHeaders={true}
              rowHeaders={true}
              readOnly={true}
              stretchH="all"
              width="100%"
              height="100%"
              className="admin-sheet-table"
              licenseKey="non-commercial-and-evaluation"
              settings={{
                // 읽기 전용 설정
                readOnly: true,
                disableVisualSelection: false,
                
                // 스타일링
                className: 'htCenter htMiddle',
                
                // 스크롤 설정
                scrollToBottom: false,
                scrollToRight: false,
                
                // 컨텍스트 메뉴 비활성화
                contextMenu: false,
                
                // 컬럼 리사이징 허용
                manualColumnResize: true,
                manualRowResize: true,
                
                // 헤더 설정
                colHeaders: true,
                rowHeaders: true,
                
                // 선택 설정
                selectionMode: 'range',
                outsideClickDeselects: false,
                
                // 렌더링 최적화
                viewportRowRenderingOffset: 100,
                viewportColumnRenderingOffset: 100,
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">시트 데이터가 없습니다</h3>
              <p className="text-sm text-gray-400">선택된 시트에 데이터가 없습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
