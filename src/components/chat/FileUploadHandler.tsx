'use client'

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { XLSXData, useUnifiedStore } from '@/stores';
import { XIcon, FileIcon, FileSpreadsheetIcon, CheckCircleIcon, CloudIcon, MessageCircleIcon } from 'lucide-react';

interface FileUploadHandlerProps {
    isDragOver?: boolean;
    xlsxData: XLSXData;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: () => void;
    switchToSheet: (sheetIndex: number) => void;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({
    isDragOver = false,
    xlsxData,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    removeFile,
    switchToSheet
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewFiles, setPreviewFiles] = useState<File[]>([]);
    
    const {
        loadingStates,
        errors,
        canUploadFile,
        setLoadingState,
        setError,
        // 스프레드시트 관련 상태
        currentSpreadsheetId,
        spreadsheetMetadata,
        currentChatId
    } = useUnifiedStore();

    return (
        <div className="py-3 px-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                    <FileSpreadsheetIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div className="flex flex-col">
                        <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">
                                현재 파일:
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                                {xlsxData.fileName}
                            </span>
                            {/* 저장 상태 표시 */}
                            {spreadsheetMetadata?.isSaved && (
                                <span className="ml-2" title="Firebase에 저장됨">
                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col text-xs text-gray-500 mt-1">
                            {xlsxData.sheets && (
                                <span>
                                    시트 {xlsxData.sheets.length}개 / 활성 시트: {xlsxData.sheets[xlsxData.activeSheetIndex]?.sheetName}
                                </span>
                            )}
                            
                            {/* 마지막 저장 시간 표시 */}
                            {spreadsheetMetadata?.lastSaved && (
                                <span className="text-xs text-gray-400 mt-1">
                                    저장됨: {new Date(spreadsheetMetadata.lastSaved).toLocaleString('ko-KR')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {xlsxData.sheets && xlsxData.sheets.length > 1 && (
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