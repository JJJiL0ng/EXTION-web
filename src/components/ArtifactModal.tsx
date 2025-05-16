// components/ArtifactModal.tsx
'use client'

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUnifiedDataStore } from '@/stores/useUnifiedDataStore';
import ArtifactRenderContainer from './ArtifactRenderContainer';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArtifactModal({ isOpen, onClose }: ArtifactModalProps) {
  const { artifactCode } = useUnifiedDataStore();

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 모달이 열렸을 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
      // 모달이 열렸을 때 body에 modal-open 클래스 추가 (Handsontable z-index 제어용)
      document.body.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      // 모달이 닫힐 때 modal-open 클래스 제거
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div 
        className="relative bg-white rounded-lg shadow-xl w-[80%] h-[80%] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-indigo-600 rounded-sm"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {artifactCode?.title || '데이터 분석 결과'}
              </h2>
              <p className="text-sm text-gray-500">
                {artifactCode?.type && `${artifactCode.type.charAt(0).toUpperCase() + artifactCode.type.slice(1)} Analysis`}
                {artifactCode?.timestamp && ` • ${artifactCode.timestamp.toLocaleString('ko-KR')}`}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 모달 본문 */}
        <div className="flex-1 overflow-hidden">
          <ArtifactRenderContainer />
        </div>
      </div>
    </div>
  );
}