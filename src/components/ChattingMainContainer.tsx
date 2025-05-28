// components/MainContainer.tsx (메인 컨테이너 - 모든 컴포넌트 통합)
'use client'

import React from 'react';
import ArtifactModal from './artifact/ArtifactModal';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';
import MainChatComponent from './chat/MainChatComponent';

export default function MainContainer() {
  // 확장된 스토어 사용
  const { 
    isArtifactModalOpen, 
    closeArtifactModal,
    xlsxData,
    activeSheetData
  } = useExtendedUnifiedDataStore();

  return (
    <div className="h-screen w-full bg-gray-50 relative">
      {/* 메인 채팅 영역 */}
      <div className="h-full">
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