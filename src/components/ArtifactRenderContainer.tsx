// components/ArtifactRenderContainer.tsx
'use client'

import React from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

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
  return <DynamicArtifactRenderer />;
}