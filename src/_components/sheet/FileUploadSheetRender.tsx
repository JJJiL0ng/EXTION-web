import React from 'react';
import { SpreadSheets } from "@mescius/spread-sheets-react";

interface FileUploadSheetRenderProps {
    // 파일 업로드 상태
    isFileUploaded: boolean;
    isDragActive: boolean;
    uploadState: {
        isUploading: boolean;
        isProcessing: boolean;
        progress: number;
    };

    // 이벤트 핸들러
    onUploadButtonClick: () => void;

    // 드래그&드롭 핸들러들
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;

    // SpreadJS 관련
    initSpread?: (spread: any) => void;
    hostStyle?: any;
}

/**
 * 파일 업로드 영역 컴포넌트
 */
export const FileUploadSheetRender: React.FC<FileUploadSheetRenderProps> = ({
    isFileUploaded,
    isDragActive,
    uploadState,
    onUploadButtonClick,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    initSpread,
    hostStyle
}) => {
    return (
        <div 
            className="w-full relative"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* 파일이 업로드되지 않았을 때 표시되는 업로드 안내 영역 */}
            {!isFileUploaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center max-w-md mx-4">
                        <div className="mb-8">
                            <svg 
                                className="w-16 h-16 text-[#005ed9] mx-auto mb-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={1.5} 
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                                />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                파일을 업로드하여 시작하세요
                            </h3>
                            <p className="text-gray-500 text-sm">
                                Excel, CSV, JSON 파일을 지원합니다
                            </p>
                        </div>

                        {/* 드래그&드롭 영역 */}
                        <div 
                            className={`border-2 border-dashed rounded-lg p-8 mb-4 transition-all duration-200 ${
                                isDragActive 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            {isDragActive ? (
                                <div className="text-blue-600">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="font-medium">파일을 여기에 놓아주세요</p>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="font-medium mb-1">파일을 드래그하여 놓거나</p>
                                    <button
                                        onClick={onUploadButtonClick}
                                        disabled={uploadState.isUploading}
                                        className="text-[#005ed9] hover:text-blue-700 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        여기를 클릭하여 선택
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 업로드 중 상태 표시 */}
                        {(uploadState.isUploading || uploadState.isProcessing) && (
                            <div className="flex items-center justify-center gap-2 text-blue-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm">
                                    {uploadState.isProcessing ? `처리 중... ${uploadState.progress}%` : '업로드 중...'}
                                </span>
                            </div>
                        )}

                        {/* 지원 파일 형식 안내 */}
                        <div className="text-xs text-gray-400 mt-4">
                            지원 형식: .xlsx, .xls, .csv, .json (최대 50MB)
                        </div>
                    </div>
                </div>
            )}

            {/* 드래그 오버레이 */}
            {isDragActive && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed z-20 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                        <div className="text-blue-600 text-center">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="font-semibold">파일을 여기에 놓아주세요</p>
                        </div>
                    </div>
                </div>
            )}

            {/* SpreadJS 컴포넌트 */}
            {initSpread && (
                <SpreadSheets
                    workbookInitialized={initSpread}
                    hostStyle={hostStyle}>
                </SpreadSheets>
            )}
        </div>
    );
};