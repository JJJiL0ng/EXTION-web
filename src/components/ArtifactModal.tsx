// components/ArtifactModal.tsx
'use client'

import React, { useEffect } from 'react';
import { X, Layers, FileText } from 'lucide-react';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';
import ArtifactRenderContainer from './ArtifactRenderContainer';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArtifactModal({ isOpen, onClose }: ArtifactModalProps) {
  // 확장된 스토어 사용
  const { 
    artifactCode, 
    xlsxData, 
    activeSheetData,
    extendedSheetContext 
  } = useExtendedUnifiedDataStore();

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
        className="relative bg-white rounded-lg shadow-xl w-[90%] h-[90%] flex flex-col overflow-hidden max-w-7xl"
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
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {artifactCode?.type && (
                  <>
                    <span>{artifactCode.type.charAt(0).toUpperCase() + artifactCode.type.slice(1)} Analysis</span>
                    <span>•</span>
                  </>
                )}
                {artifactCode?.timestamp && (
                  <>
                    <span>{artifactCode.timestamp.toLocaleString('ko-KR')}</span>
                    <span>•</span>
                  </>
                )}
                {xlsxData && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{xlsxData.fileName}</span>
                  </div>
                )}
                {xlsxData && xlsxData.sheets.length > 1 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Layers className="w-3 h-3" />
                      <span>{xlsxData.sheets.length}개 시트</span>
                    </div>
                  </>
                )}
                {activeSheetData && xlsxData && xlsxData.sheets.length > 1 && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-indigo-600">
                      활성: {activeSheetData.sheetName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 데이터 요약 정보 */}
            {activeSheetData && (
              <div className="text-xs text-gray-500 mr-2">
                {activeSheetData.headers.length}열 × {activeSheetData.data.length}행
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 모달 본문 */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <ArtifactRenderContainer />
        </div>

        {/* 모달 하단 정보 바 (선택사항) */}
        {xlsxData && (
          <div className="bg-white border-t border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>파일: {xlsxData.fileName}</span>
                {extendedSheetContext && (
                  <>
                    <span>•</span>
                    <span>시트: {extendedSheetContext.sheetName}</span>
                    <span>•</span>
                    <span>
                      헤더 범위: {extendedSheetContext.dataRange.startColumn}1 ~ {extendedSheetContext.dataRange.endColumn}1
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span>총 {xlsxData.sheets.length}개 시트</span>
                {xlsxData.sheets.length > 1 && (
                  <>
                    <span>•</span>
                    <span>
                      ({xlsxData.sheets.map(s => s.sheetName).join(', ')})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}