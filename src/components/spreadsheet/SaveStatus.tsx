'use client'

import React from 'react';
import { AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SaveStatusProps {
  currentSheetMetaDataId: string | null;
  saveStatus: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
  currentSheetMetaDataId,
  saveStatus,
}) => {
  if (!currentSheetMetaDataId) return null; // 파일이 없을 때는 표시 안함

  let icon = null;
  let iconColor = 'text-gray-500';

  switch (saveStatus) {
    case 'modified':
      icon = <AlertCircle className="h-4 w-4" />;
      iconColor = 'text-yellow-600';
      break;
    case 'saving':
      icon = <Loader2 className="h-4 w-4 animate-spin" />;
      iconColor = 'text-blue-600';
      break;
    case 'synced':
      icon = <CheckCircle className="h-4 w-4" />;
      iconColor = 'text-green-600';
      break;
    case 'error':
      icon = <XCircle className="h-4 w-4" />;
      iconColor = 'text-red-600';
      break;
  }

  if (!icon) return null;

  return (
    <div className="flex items-center mr-4">
      <div className={iconColor}>{icon}</div>
    </div>
  );
}; 