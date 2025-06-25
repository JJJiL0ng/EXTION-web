// components/ArtifactRenderContainer.tsx
'use client'

import React from 'react';
import { Loader2, Layers, Cloud, HardDrive } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useUnifiedStore } from '@/stores';
import ArtifactRenderer from './ArtifactRenderer';

// Dynamic import로 hydration 문제 방지
const DynamicArtifactRenderer = dynamic(
  () => import('./ArtifactRenderer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">아티팩트를 불러오고 있습니다...</p>
        </div>
      </div>
    )
  }
);

interface ArtifactRenderContainerProps {
    className?: string;
    showBorder?: boolean;
    isPreview?: boolean;
}

export default function ArtifactRenderContainer({ 
    className = '', 
    showBorder = true, 
    isPreview = false 
}: ArtifactRenderContainerProps) {
    
    const {
        artifactCode,
        loadingStates,
        errors,
        xlsxData,
        activeSheetData,
        currentSheetMetaDataId,
        currentChatId
    } = useUnifiedStore();

    // 현재 채팅이 클라우드 채팅인지 확인
    const isCloudChat = () => {
        const sheetMetaDataId = currentSheetMetaDataId;
        return !!(sheetMetaDataId || (currentChatId && currentChatId.length > 20 && !currentChatId.includes('_local')));
    };

    // 데이터 소스 정보 가져오기
    const getDataSourceInfo = () => {
        if (isCloudChat()) {
            return {
                type: 'cloud' as const,
                icon: <Cloud className="w-3 h-3" />,
                label: '클라우드',
                color: 'text-blue-600'
            };
        }
        return {
            type: 'local' as const,
            icon: <HardDrive className="w-3 h-3" />,
            label: '로컬',
            color: 'text-green-600'
        };
    };

    // 시트 전환 중일 때는 로딩 표시
    if (loadingStates.sheetSwitch && xlsxData && xlsxData.sheets.length > 1) {
        const dataSource = getDataSourceInfo();
        
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <Layers className="h-8 w-8 text-gray-400 mr-2" />
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                    <p className="text-gray-600">시트를 전환하고 있습니다...</p>
                    {activeSheetData && (
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500">
                                {activeSheetData.sheetName}로 전환 중
                            </p>
                            <div className={`flex items-center justify-center gap-1 text-xs ${dataSource.color}`}>
                                {React.cloneElement(dataSource.icon, { className: 'w-3 h-3' })}
                                <span>{dataSource.label} 데이터</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <DynamicArtifactRenderer />;
}