import React, { useState, useEffect } from 'react';
import { useGetSheetNames } from '../../_hooks/sheet/useGetSheetNames';
import SelectedSheetNameCard from './SelectedSheetNameCard';

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

  useEffect(() => {
    if (isOpen && spreadRef.current) {
      const names = getSheetNames();
      setSheetNames(names);
    }
  }, [isOpen, getSheetNames, spreadRef]);

  const handleSheetSelect = (sheetName: string) => {
    onSelectSheet(sheetName);
    onClose();
  };

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
            ×
          </button>
        </div>


        <div className="space-y-2 ">
          <div className="border-t border-gray-200 mb-1" />
          {sheetNames.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              사용 가능한 시트가 없습니다.
            </p>
          ) : (
            sheetNames.map((sheetName, index) => (
              <button
                key={index}
                onClick={() => handleSheetSelect(sheetName)}
                className="hover:bg-gray-50 rounded-lg px-1 transition-colors"
              >
                <SelectedSheetNameCard
                  fileName={sheetName}
                  showIcon={true}
                  spreadRef={spreadRef}
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};