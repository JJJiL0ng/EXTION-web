import React, { useState, useEffect } from 'react';
import { useGetSheetNames } from '../../_hooks/sheet/useGetSheetNames';
import { File } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">시트 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {sheetNames.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              사용 가능한 시트가 없습니다.
            </p>
          ) : (
            sheetNames.map((sheetName, index) => (
              <button
                key={index}
                onClick={() => handleSheetSelect(sheetName)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-medium">{sheetName}</div>
              </button>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};