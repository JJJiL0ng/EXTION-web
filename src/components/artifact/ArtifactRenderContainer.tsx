// components/ArtifactRenderContainer.tsx
'use client'

import React from 'react';
import { Loader2, Layers } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';

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

export default function ArtifactRenderComponent() {
  // 확장된 스토어를 사용하여 다중 시트 정보 표시
  const { xlsxData, activeSheetData, loadingStates } = useExtendedUnifiedDataStore();

  // 시트 전환 중일 때는 로딩 표시
  if (loadingStates.sheetSwitch && xlsxData && xlsxData.sheets.length > 1) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Layers className="h-8 w-8 text-blue-600 mr-2" />
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <p className="text-gray-600">시트를 전환하고 있습니다...</p>
          {activeSheetData && (
            <p className="text-sm text-gray-500 mt-1">
              {activeSheetData.sheetName}로 전환 중
            </p>
          )}
        </div>
      </div>
    );
  }

  return <DynamicArtifactRenderer />;
}