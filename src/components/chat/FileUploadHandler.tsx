'use client'

import React from 'react';
import { XIcon, FileIcon, FileSpreadsheetIcon, CheckCircleIcon, CloudIcon } from 'lucide-react';
import { XLSXData, useExtendedUnifiedDataStore } from '@/stores/useUnifiedDataStore';

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
    // 스토어에서 스프레드시트 관련 상태 가져오기
    const {
        currentSpreadsheetId,
        spreadsheetMetadata,
        currentChatId
    } = useExtendedUnifiedDataStore();

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
                            {/* 저장 상태 표시 */}
                            {spreadsheetMetadata?.isSaved && (
                                <span className="ml-2" title="Firebase에 저장됨">
                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col text-xs text-gray-500 mt-1">
                            {xlsxData?.sheets && (
                                <span>
                                    시트 {xlsxData.sheets.length}개 / 활성 시트: {xlsxData.sheets[xlsxData.activeSheetIndex]?.sheetName}
                                </span>
                            )}
                            
                            {/* 스프레드시트 ID와 채팅 ID 표시 */}
                            <div className="flex items-center space-x-3 mt-1">
                                {currentSpreadsheetId && (
                                    <div className="flex items-center">
                                        <CloudIcon className="h-3 w-3 text-gray-400 mr-1" />
                                        <span className="font-mono text-xs">
                                            ID: {currentSpreadsheetId.substring(0, 8)}...
                                        </span>
                                    </div>
                                )}
                                
                                {currentChatId && (
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-1">💬</span>
                                        <span className="font-mono text-xs">
                                            채팅: {currentChatId.substring(0, 8)}...
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* 마지막 저장 시간 표시 */}
                            {spreadsheetMetadata?.lastSaved && (
                                <span className="text-xs text-gray-400 mt-1">
                                    저장됨: {new Date(spreadsheetMetadata.lastSaved).toLocaleString('ko-KR')}
                                </span>
                            )}
                        </div>
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