// components/MainContainer.tsx (메인 컨테이너 - 모든 컴포넌트 통합)
'use client'

import React from 'react';
import CSVChatComponent from './CSVChatComponent';
import ArtifactModal from './ArtifactModal';
import { useUnifiedDataStore } from '@/stores/useUnifiedDataStore';

export default function MainContainer() {
  const { 
    isArtifactModalOpen, 
    closeArtifactModal 
  } = useUnifiedDataStore();

  return (
    <div className="h-screen w-full bg-gray-50">
      {/* 메인 채팅 영역 */}
      <div className="h-full w-full">
        <CSVChatComponent />
      </div>

      {/* 아티팩트 모달 */}
      <ArtifactModal 
        isOpen={isArtifactModalOpen}
        onClose={closeArtifactModal}
      />
    </div>
  );
}