import React from 'react';
// import { useGetSheetNames } from '../../_hooks/sheet/useGetSheetNames';
import SelectedSheetNameCard from './SelectedSheetNameCard';
import { X } from 'lucide-react';
import { useSelectedSheetInfoStore } from '../../_hooks/sheet/common/useSelectedSheetInfoStore';

import { useSpreadSheetNames } from '@/_aaa_sheetChat/_hooks/sheet/common/useSpreadSheetNames'


interface FileSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSheet: (sheetName: string) => void;
}

export const FileSelectModal: React.FC<FileSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectSheet,
}) => {
  const { spreadSheetNames } = useSpreadSheetNames();

  // useSelectedSheetInfoStore 훅 사용
  const { selectedSheets, addSelectedSheet, removeSelectedSheet, isSheetSelected, addAllSheets, clearSelectedSheets } = useSelectedSheetInfoStore();

  // 최신 시트 이름은 훅에서 스토어를 통해 자동 반영됩니다.

  const handleSheetToggle = (sheetName: string, sheetIndex: number) => {
    if (isSheetSelected(sheetName)) {
      removeSelectedSheet(sheetName);
    } else {
      addSelectedSheet(sheetName, sheetIndex);
    }
    onSelectSheet(sheetName);
  };

  const handleAddAllSheets = () => {
    // 모두 선택된 상태면 전체 해제, 아니면 전체 선택
    if (spreadSheetNames.length > 0 && spreadSheetNames.every(name => isSheetSelected(name))) {
      clearSelectedSheets();
      // 해제 시에도 콜백 동작을 기존 토글 패턴과 동일하게 유지
      spreadSheetNames.forEach(sheetName => onSelectSheet(sheetName));
    } else {
      const allSheets = spreadSheetNames.map((name, index) => ({ name, index }));
      addAllSheets(allSheets);
      // 모든 시트에 대해 onSelectSheet 호출
      spreadSheetNames.forEach(sheetName => onSelectSheet(sheetName));
    }
  };

  const isAllSheetsSelected = spreadSheetNames.length > 0 && spreadSheetNames.every(name => isSheetSelected(name));

  if (!isOpen) return null;

  return (
    <div className="p-2 absolute bottom-full left-0 right-0 z-50">
      <div className="sheet-select-modal bg-white border-2 border-gray-200 rounded-xl p-2 w-64 max-h-96 overflow-auto shadow-lg">
        <div className="px-2 flex justify-between items-center mb-1">
          <span className="text-sm text-gray-700 font-semibold">Select sheets</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close modal"
          >
            <X />
          </button>
        </div>


        <div>
          <div className="border-t border-gray-200 py-1 px-2" />
      {spreadSheetNames.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No sheets available.
            </p>
          ) : (
            <div className="px-1 flex flex-wrap gap-2 items-start justify-start">
              {/* 시트가 2개 이상일 때만 "모든 파일 추가" 카드 표시 */}
        {spreadSheetNames.length >= 2 && (
                <button
                  type="button"
                  onClick={handleAddAllSheets}
                  className="hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <SelectedSheetNameCard
                    fileName="Select all sheets"
                    showIcon={true}
                    mode='modal-whole-file'
                    isSelected={isAllSheetsSelected}
                  />
                </button>
              )}

              {/* 개별 시트들 */}
        {spreadSheetNames.map((sheetName, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSheetToggle(sheetName, index)}
                  className="hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <SelectedSheetNameCard
                    fileName={sheetName}
                    showIcon={true}
                    mode='modal'
                    isSelected={isSheetSelected(sheetName)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};