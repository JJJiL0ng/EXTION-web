'use client'

import React from 'react';
import { SelectedCellInfo } from '@/types/spreadsheet';

interface CellEditorProps {
  selectedCellInfo: SelectedCellInfo | null;
  cellEditValue: string;
  isCellEditing: boolean;
  onCellEditChange: (value: string) => void;
  onCellEditSubmit: () => void;
  onCellEditCancel: () => void;
  onCellEditKeyDown: (e: React.KeyboardEvent) => void;
  onSetCellEditing: (editing: boolean) => void;
}

export const CellEditor: React.FC<CellEditorProps> = ({
  selectedCellInfo,
  cellEditValue,
  isCellEditing,
  onCellEditChange,
  onCellEditSubmit,
  onCellEditCancel,
  onCellEditKeyDown,
  onSetCellEditing,
}) => {
  if (!selectedCellInfo) return null;

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-700 flex-1 mr-4 min-w-0">
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span className="font-mono bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
          {selectedCellInfo.cellAddress}
        </span>
      </div>

      {/* 편집 가능한 셀 값 입력 필드 */}
      <div className="flex items-center space-x-2 flex-1 max-w-md min-w-0">
        <span className="font-medium flex-shrink-0">Fx:</span>
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={cellEditValue}
            onChange={(e) => onCellEditChange(e.target.value)}
            onFocus={() => onSetCellEditing(true)}
            onBlur={() => {
              // 블러 이벤트에서는 약간의 지연을 둬서 버튼 클릭이 처리될 수 있도록 함
              setTimeout(() => {
                if (!isCellEditing) return;
                onCellEditSubmit();
              }, 150);
            }}
            onKeyDown={onCellEditKeyDown}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
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
            placeholder="값 또는 수식 입력 (예: =SUM(A1:A5))"
          />

          {/* 편집 모드일 때 확인/취소 버튼 표시 */}
          {isCellEditing && (
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <button
                type="button"
                onClick={onCellEditSubmit}
                className="w-6 h-6 text-white rounded text-xs flex items-center justify-center transition-colors duration-200"
                style={{ backgroundColor: '#005DE9' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#004ab8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#005DE9';
                }}
                title="확인 (Enter)"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={onCellEditCancel}
                className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded text-xs flex items-center justify-center transition-colors duration-200"
                title="취소 (Escape)"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 