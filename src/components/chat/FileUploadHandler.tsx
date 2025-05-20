'use client'

import React from 'react';
import { FileText, X } from 'lucide-react';
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

export default function FileUploadHandler({
    isDragOver,
    xlsxData,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    removeFile,
    switchToSheet
}: FileUploadHandlerProps) {
    // 파일이 로드되었는지 확인 - xlsxData로 변경
    const file = xlsxData ? { name: xlsxData.fileName } : null;

    return (
        <div className="bg-white border-b border-gray-100 p-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center">
                        <FileText className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {file?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {xlsxData ? (
                                xlsxData.sheets.length > 1
                                    ? `${xlsxData.sheets.length}개 시트 | 활성: ${xlsxData.sheets[xlsxData.activeSheetIndex].sheetName}`
                                    : `${xlsxData.sheets[0].headers.length} 열 × ${xlsxData.sheets[0].data.length} 행`
                            ) : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={removeFile}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>

            {/* 다중 시트 선택 UI 추가 */}
            {xlsxData && xlsxData.sheets.length > 1 && (
                <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs text-gray-600">시트:</span>
                    <select
                        value={xlsxData.activeSheetIndex}
                        onChange={(e) => switchToSheet(parseInt(e.target.value))}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                    >
                        {xlsxData.sheets.map((sheet: any, index: number) => (
                            <option key={index} value={index}>
                                {sheet.sheetName}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
} 