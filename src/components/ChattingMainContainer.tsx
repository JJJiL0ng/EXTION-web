// components/MainContainer.tsx (메인 컨테이너 - 모든 컴포넌트 통합)
'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MainSpreadSheet from './MainSpreadSheet';
import { Loader2, Activity } from 'lucide-react';
import { useUnifiedStore } from '@/stores';
import ArtifactModal from './artifact/ArtifactModal';
import MainChatComponent from './chat/MainChatComponent';

export default function ChattingMainContainer() {
  const [currentComponent, setCurrentComponent] = useState('mainSpreadSheet');
  
  const { 
    xlsxData,
    loadingStates,
    errors,
    hasUploadedFile,
    canUploadFile,
    // 확장된 스토어 기능들
    isArtifactModalOpen, 
    closeArtifactModal,
    activeSheetData
  } = useUnifiedStore();

  return (
    <div className="h-full w-full bg-gray-50 relative overflow-hidden flex flex-col">
      {/* 메인 채팅 영역 */}
      <div className="flex-1 overflow-hidden">
        <MainChatComponent />
      </div>

      {/* 아티팩트 모달 - XLSX 데이터 지원 */}
      <ArtifactModal 
        isOpen={isArtifactModalOpen}
        onClose={closeArtifactModal}
      />
    </div>
  );
}