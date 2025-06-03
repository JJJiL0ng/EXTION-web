// components/ArtifactModal.tsx
'use client'

import React, { useEffect, useState } from 'react';
import { X, Layers, FileText, Maximize2, Download, Share2, Cloud, HardDrive, Copy, Minimize2 } from 'lucide-react';
import { useUnifiedStore } from '@/stores';
import ArtifactRenderContainer from './ArtifactRenderContainer';
import { ResponsiveContainer } from 'recharts';
import { BarChart } from 'recharts';
import { Button } from '@/components/ui/Button';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArtifactModal: React.FC<ArtifactModalProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const {
    artifactCode,
    isArtifactModalOpen,
    closeArtifactModal,
    // 확장된 스토어 기능들
    xlsxData, 
    activeSheetData,
    extendedSheetContext,
    currentSpreadsheetId,
    currentChatId
  } = useUnifiedStore();

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

  // 현재 채팅이 클라우드 채팅인지 확인
  const isCloudChat = () => {
    const spreadsheetId = currentSpreadsheetId;
    return !!(spreadsheetId || (currentChatId && currentChatId.length > 20 && !currentChatId.includes('_local')));
  };

  // 데이터 소스 표시
  const getDataSourceInfo = () => {
    if (isCloudChat()) {
      return {
        icon: <Cloud className="w-3 h-3" />,
        label: '클라우드',
        color: 'text-blue-600 bg-blue-50'
      };
    }
    return {
      icon: <HardDrive className="w-3 h-3" />,
      label: '로컬',
      color: 'text-green-600 bg-green-50'
    };
  };

  const dataSource = getDataSourceInfo();

  // 다운로드 기능 (실제 구현은 필요에 따라 추가)
  const handleDownload = () => {
    console.log('다운로드 기능');
    // 여기에 다운로드 로직 구현
  };

  // 공유 기능 (실제 구현은 필요에 따라 추가)
  const handleShare = () => {
    console.log('공유 기능');
    // 여기에 공유 로직 구현
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-300">
      {/* 배경 오버레이 - 부드러운 애니메이션 적용 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 - 그림자 강화, 애니메이션 추가 */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl w-[92%] h-[92%] flex flex-col overflow-hidden max-w-7xl transition-all duration-300 ease-in-out transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 - 디자인 개선 */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-5 h-5 bg-indigo-600 rounded-sm"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {artifactCode?.title || '데이터 분석 결과'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {artifactCode?.type && (
                  <span className="bg-indigo-50 px-2 py-0.5 rounded-full text-indigo-700 text-xs font-medium">
                    {artifactCode.type.charAt(0).toUpperCase() + artifactCode.type.slice(1)} 분석
                  </span>
                )}
                {/* 데이터 소스 표시 */}
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${dataSource.color}`}>
                  {dataSource.icon}
                  {dataSource.label}
                </span>
                {artifactCode?.timestamp && (
                  <span className="text-gray-500">
                    {artifactCode.timestamp.toLocaleString('ko-KR')}
                  </span>
                )}
                {xlsxData && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{xlsxData.fileName}</span>
                  </div>
                )}
                {xlsxData && xlsxData.sheets.length > 1 && (
                  <div className="flex items-center space-x-1">
                    <Layers className="w-3 h-3" />
                    <span>{xlsxData.sheets.length}개 시트</span>
                  </div>
                )}
                {activeSheetData && xlsxData && xlsxData.sheets.length > 1 && (
                  <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs">
                    활성: {activeSheetData.sheetName}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 데이터 요약 정보 */}
            {activeSheetData && (
              <div className="text-xs text-gray-500 mr-2 hidden md:block">
                {activeSheetData.headers.length}열 × {activeSheetData.data.length}행
              </div>
            )}
            
            {/* 액션 버튼 그룹 */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="분석 결과 다운로드"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="분석 결과 공유"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* 모달 본문 */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <ArtifactRenderContainer />
        </div>

        {/* 모달 하단 정보 바 - 개선된 디자인 */}
        {xlsxData && (
          <div className="bg-white border-t border-gray-200 px-4 py-2.5 shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between text-xs text-gray-500 gap-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-medium">파일: <span className="text-indigo-600">{xlsxData.fileName}</span></span>
                {extendedSheetContext && (
                  <>
                    <span className="font-medium">시트: <span className="text-indigo-600">{extendedSheetContext.sheetName}</span></span>
                    <span className="hidden md:inline-block">
                      헤더 범위: {extendedSheetContext.dataRange.startColumn}1 ~ {extendedSheetContext.dataRange.endColumn}1
                    </span>
                  </>
                )}
                {/* 데이터 소스 정보 */}
                <span className={`flex items-center gap-1 font-medium ${dataSource.color.split(' ')[0]}`}>
                  {dataSource.icon}
                  {dataSource.label} 데이터
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>총 {xlsxData.sheets.length}개 시트</span>
                {xlsxData.sheets.length > 1 && xlsxData.sheets.length <= 5 && (
                  <span className="text-indigo-600">
                    ({xlsxData.sheets.map(s => s.sheetName).join(', ')})
                  </span>
                )}
                {xlsxData.sheets.length > 5 && (
                  <span className="text-indigo-600">
                    ({xlsxData.sheets.slice(0, 3).map(s => s.sheetName).join(', ')} 외 {xlsxData.sheets.length - 3}개)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtifactModal;