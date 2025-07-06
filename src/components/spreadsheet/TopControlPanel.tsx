'use client'

import React from 'react';
import { MessageCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { CellEditor } from '@/components/spreadsheet/CellEditor';
import { SaveStatus } from '@/components/spreadsheet/SaveStatus';
import { ExportControls } from '@/components/spreadsheet/ExportControls';
import { SelectedCellInfo } from '@/types/spreadsheet';
import { LayoutDashboard } from 'lucide-react';

interface TopControlPanelProps {
  selectedCellInfo: SelectedCellInfo | null;
  cellEditValue: string;
  isCellEditing: boolean;
  pendingFormula: any;
  currentSheetMetaDataId: string | null;
  saveStatus: string;
  onCellEditChange: (value: string) => void;
  onCellEditSubmit: () => void;
  onCellEditCancel: () => void;
  onCellEditKeyDown: (e: React.KeyboardEvent) => void;
  onSetCellEditing: (editing: boolean) => void;
  onSetPendingFormula: (formula: any) => void;
  xlsxData: any;
  activeSheetData: any;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopControlPanel: React.FC<TopControlPanelProps> = ({
  selectedCellInfo,
  cellEditValue,
  isCellEditing,
  pendingFormula,
  currentSheetMetaDataId,
  saveStatus,
  onCellEditChange,
  onCellEditSubmit,
  onCellEditCancel,
  onCellEditKeyDown,
  onSetCellEditing,
  onSetPendingFormula,
  xlsxData,
  activeSheetData,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <div className="example-controls-container bg-[#F9F9F7] border-b border-gray-200 p-2 shadow-sm flex-shrink-0 " style={{ position: 'relative', zIndex: 9000 }}>
      <div className="flex items-center justify-between space-x-2">
        {/* 왼쪽: 햄버거 버튼과 로고 */}
        <div className="flex items-center space-x-2">
        
          <Link href="/dashboard" className="cursor-pointer">
            <h1 className="text-xl font-bold text-gray-800" style={{ color: '#005DE9' }}>
              EXTION
            </h1>
          </Link>
          {/* <Link href="/dashboard" className="group relative">
            <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
              <LayoutDashboard className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm text-gray-600 group-hover:text-blue-600">대시보드</span>
            </div>
            <div className="absolute left-0 top-full mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              대시보드로 가기
            </div>
          </Link> */}
        </div>

        {/* 중앙: 셀 편집기 */}
        <CellEditor
          selectedCellInfo={selectedCellInfo}
          cellEditValue={cellEditValue}
          isCellEditing={isCellEditing}
          onCellEditChange={onCellEditChange}
          onCellEditSubmit={onCellEditSubmit}
          onCellEditCancel={onCellEditCancel}
          onCellEditKeyDown={onCellEditKeyDown}
          onSetCellEditing={onSetCellEditing}
        />

        {/* 오른쪽: 저장 상태, 버튼들 */}
        <div className="flex items-center ml-auto space-x-2">
          <SaveStatus 
            currentSheetMetaDataId={currentSheetMetaDataId}
            saveStatus={saveStatus}
          />
          
          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm transition-colors duration-200"
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
            <LayoutDashboard className="w-4 h-4 text-blue-600 group-hover:text-blue-600" />
            <span>홈화면으로 가기</span>
          </Link>
          
          <ExportControls 
            xlsxData={xlsxData}
            activeSheetData={activeSheetData}
          />
        </div>
      </div>

      {/* 포뮬러 적용 대기 알림 */}
      {pendingFormula && (
        <div className="rounded-xl p-4 mt-4"
          style={{
            backgroundColor: 'rgba(0, 93, 233, 0.08)',
            borderColor: 'rgba(0, 93, 233, 0.2)',
            border: '1px solid'
          }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#005DE9' }}>
                포뮬러 적용 대기 중
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(0, 93, 233, 0.8)' }}>
                {pendingFormula.cellAddress}에 {pendingFormula.formula} 적용
                {pendingFormula.sheetIndex !== undefined &&
                  ` (시트 ${xlsxData?.sheets[pendingFormula.sheetIndex]?.sheetName || pendingFormula.sheetIndex})`
                }
              </p>
            </div>
            <button
              onClick={() => onSetPendingFormula(null)}
              className="text-sm bg-white px-3 py-1.5 rounded-lg border transition-colors duration-200"
              style={{
                color: '#005DE9',
                borderColor: 'rgba(0, 93, 233, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#004ab8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#005DE9';
              }}
              type="button"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 