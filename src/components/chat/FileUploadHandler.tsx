'use client'

import React from 'react';
import { XIcon } from 'lucide-react';
import { XLSXData } from '@/stores/useUnifiedDataStore';

interface FileUploadHandlerProps {
    isDragOver: boolean;
    xlsxData: XLSXData | null;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: () => void;
    switchToSheet: (index: number) => void;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({
    isDragOver,
    xlsxData,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    removeFile,
    switchToSheet
}) => {
    return (
        <div className="border-t border-gray-100 py-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">
                        현재 파일:
                    </span>
                    <span className="text-sm text-blue-600">
                        {xlsxData?.fileName}
                    </span>
                </div>
                <button
                    onClick={removeFile}
                    className="p-1 rounded-md hover:bg-gray-100"
                    aria-label="파일 제거"
                >
                    <XIcon className="h-4 w-4 text-gray-500" />
                </button>
            </div>
            
            {xlsxData && xlsxData.sheets && xlsxData.sheets.length > 1 && (
                <div className="mt-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">시트 선택:</div>
                    <div className="flex flex-wrap gap-2">
                        {xlsxData.sheets.map((sheet, index) => (
                            <button
                                key={index}
                                onClick={() => switchToSheet(index)}
                                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                                    index === xlsxData.activeSheetIndex
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {sheet.sheetName}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadHandler; 