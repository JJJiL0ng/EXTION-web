import React, { useState, useEffect } from 'react';
import { useGetSheetNames } from '../../_hooks/sheet/useGetSheetNames';
import SelectedSheetNameCard from './SelectedSheetNameCard';
import { X } from 'lucide-react';
import { useSelectedSheetInfoStore } from '../../_hooks/sheet/useSelectedSheetInfoStore';

interface FileSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSheet: (sheetName: string) => void;
  spreadRef: React.RefObject<any>;
}

export const FileSelectModal: React.FC<FileSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectSheet,
  spreadRef,
}) => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const { getSheetNames } = useGetSheetNames({ spreadRef });
  
  // useSelectedSheetInfoStore 훅 사용
  const { selectedSheets, addSelectedSheet, removeSelectedSheet, isSheetSelected, addAllSheets, clearSelectedSheets } = useSelectedSheetInfoStore();

  useEffect(() => {
    if (isOpen && spreadRef.current) {
      const names = getSheetNames();
      setSheetNames(names);
    }
  }, [isOpen, getSheetNames, spreadRef]);

  const handleSheetToggle = (sheetName: string, sheetIndex: number) => {
    if (isSheetSelected(sheetName)) {
      removeSelectedSheet(sheetName);
    } else {
      addSelectedSheet(sheetName, sheetIndex);
    }
    onSelectSheet(sheetName);
  };

  const handleAddAllSheets = () => {
    const allSheets = sheetNames.map((name, index) => ({ name, index }));
    addAllSheets(allSheets);
    // 모든 시트에 대해 onSelectSheet 호출
    sheetNames.forEach(sheetName => onSelectSheet(sheetName));
  };

  const isAllSheetsSelected = sheetNames.length > 0 && sheetNames.every(name => isSheetSelected(name));

  if (!isOpen) return null;

  return (
    <div className="p-2 absolute bottom-full left-0 right-0 z-50">
      <div className="sheet-select-modal bg-white border-2 border-gray-200 rounded-xl p-2 w-64 max-h-96 overflow-auto shadow-lg">
        <div className="px-2 flex justify-between items-center mb-1">
          <span className="text-sm text-gray-700 font-semibold">시트 추가</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="닫기"
          >
            <X />
          </button>
        </div>


        <div>
          <div className="border-t border-gray-200 mb-1 px-1" />
          {sheetNames.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              사용 가능한 시트가 없습니다.
            </p>
          ) : (
            <div className="px-1 flex flex-wrap gap-2 items-start justify-start">
              {/* 시트가 2개 이상일 때만 "모든 파일 추가" 카드 표시 */}
              {sheetNames.length >= 2 && (
                <button
                  type="button"
                  onClick={handleAddAllSheets}
                  className="hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <SelectedSheetNameCard
                    fileName="모든 파일 추가"
                    showIcon={true}
                    spreadRef={spreadRef}
                    mode='modal'
                    isSelected={isAllSheetsSelected}
                  />
                </button>
              )}

              {/* 개별 시트들 */}
              {sheetNames.map((sheetName, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSheetToggle(sheetName, index)}
                  className="hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <SelectedSheetNameCard
                    fileName={sheetName}
                    showIcon={true}
                    spreadRef={spreadRef}
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