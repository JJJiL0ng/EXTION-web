'use client';

import React, { useState } from 'react';

interface RollbackAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dontShowAgain: boolean;
  onDontShowAgainChange: (value: boolean) => void;
}

const RollbackAlert: React.FC<RollbackAlertProps> = ({
  isOpen,
  onClose,
  onConfirm,
  dontShowAgain,
  onDontShowAgainChange,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">롤백 확인</h3>
        <p className="text-gray-700 mb-4">
          롤백을 진행하면 이전 메시지까지의 모든 작업이 되돌려집니다. 
          현재까지 작업한 내용이 삭제되며 복구할 수 없습니다.
        </p>
        <p className="text-gray-700 mb-6">
          정말로 롤백하시겠습니까?
        </p>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => onDontShowAgainChange(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">다시 보지 않기</span>
          </label>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#005de09] text-white rounded hover:bg-blue-700"
          >
            롤백하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RollbackAlert;
