'use client'

import React from 'react';
import { XIcon, FileIcon, FileSpreadsheetIcon } from 'lucide-react';
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
        <div className="py-3 px-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <FileSpreadsheetIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div className="flex flex-col">
                        <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">
                                현재 파일:
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                                {xlsxData?.fileName}
                            </span>
                        </div>
                        
                        {xlsxData?.sheets && (
                            <span className="text-xs text-gray-500">
                                시트 {xlsxData.sheets.length}개 / 활성 시트: {xlsxData.sheets[xlsxData.activeSheetIndex]?.sheetName}
                            </span>
                        )}
                    </div>
                </div>
                
                <button
                    onClick={removeFile}
                    className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="파일 제거"
                >
                    <XIcon className="h-4 w-4 text-gray-500" />
                </button>
            </div>
            
            {xlsxData && xlsxData.sheets && xlsxData.sheets.length > 1 && (
                <div className="mt-3">
                    <div className="text-xs font-medium text-gray-600 mb-1.5">시트 선택:</div>
                    <div className="flex flex-wrap gap-2">
                        {xlsxData.sheets.map((sheet, index) => (
                            <button
                                key={index}
                                onClick={() => switchToSheet(index)}
                                className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                                    index === xlsxData.activeSheetIndex
                                        ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
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