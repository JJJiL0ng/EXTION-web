import React, { useMemo } from 'react';
import Image from 'next/image';
import { SpreadSheets } from "@mescius/spread-sheets-react";
import { useCheckAndLoadOnMount } from "@/_hooks/sheet/data_save/useCheckAndLoad";
import { useParams } from 'next/navigation';
import { getOrCreateGuestId } from "@/_utils/guestUtils";
import useSpreadsheetIdStore from "@/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_store/chat/chatIdAndChatSessionIdStore";
import { useSpreadSheetVersionStore } from '@/_store/sheet/spreadSheetVersionIdStore';
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
    // onUploadButtonClick: () => void;

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
const FileUploadSheetRenderComponent: React.FC<FileUploadSheetRenderProps> = ({
    isFileUploaded,
    isDragActive,
    uploadState,
    // onUploadButtonClick,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    initSpread,
    hostStyle
}) => {
    // URL 파라미터와 스토어에서 ID 가져오기
    const { spreadSheetId } = useSpreadsheetIdStore();
    const { chatId } = useChatStore();

    // ID들을 안정화하여 불필요한 훅 재실행 방지
    const stableSpreadsheetId = useMemo(() => spreadSheetId || '', [spreadSheetId]);
    const stableChatId = useMemo(() => chatId || '', [chatId]);
    const stableUserId = useMemo(() => getOrCreateGuestId(), []);
    const stableSpreadsheetVersionId = useSpreadSheetVersionStore((state) => state.spreadSheetVersionId);
    const stableActivity = 'normal';
    // 백엔드 데이터 존재 여부 확인
    const { exists, loading, error } = useCheckAndLoadOnMount(
        stableSpreadsheetId,
        stableChatId,
        stableUserId,
        stableActivity,
        stableSpreadsheetVersionId
    );

    const handleUploadButtonClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput && !uploadState.isUploading) {
        fileInput.click();
    }
};


    // exists가 false일 때만 업로드 버튼 활성화
    const isUploadEnabled = exists === false && !loading;

    // 상태 변화가 있을 때만 로깅 (무한 로그 방지)
    const statusKey = `${exists}-${loading}-${isUploadEnabled}-${isFileUploaded}`;
    const lastStatusRef = React.useRef<string>('');

    React.useEffect(() => {
        if (lastStatusRef.current !== statusKey) {
            console.log('📊 [FileUploadSheetRender] 상태 변화:', {
                exists,
                loading,
                isUploadEnabled,
                isFileUploaded,
                error: error?.message
            });
            lastStatusRef.current = statusKey;
        }
    }, [statusKey, exists, loading, isUploadEnabled, isFileUploaded, error]);
    return (
        <div
            className="w-full relative"
            onDragEnter={isUploadEnabled ? onDragEnter : undefined}
            onDragLeave={isUploadEnabled ? onDragLeave : undefined}
            onDragOver={isUploadEnabled ? onDragOver : undefined}
            onDrop={isUploadEnabled ? onDrop : undefined}
        >
            {/* 파일이 업로드되지 않았을 때 표시되는 업로드 안내 영역 */}
            {!isFileUploaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 overflow-hidden">
                    {/* 배경 이미지 (외부 호스팅) */}
                    <Image
                        src="https://bucket.extion.ai/cells_bg_image.png"
                        alt=""
                        aria-hidden="true"
                        fill
                        unoptimized
                        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none select-none"
                    />
                    <div className="bg-white border-2 rounded-lg px-10 py-6 border-[#005de9] text-center max-w-md mx-4 relative z-10">
                        <div className="mb-8 flex flex-col items-center">
                            <div className="relative w-16 h-16 mb-4"> {/* 로고 크기: 72x72 */}
                                <Image
                                    src="/EXTION_new_logo.svg"
                                    alt="EXTION logo"
                                    fill
                                    sizes="72px"
                                    priority
                                    aria-hidden="true"
                                    className="object-contain"
                                />
                            </div>

                            <h3 className="text-xl font-semibold text-gray-700 mb-2 text-center">
                                Upload a file to get started
                            </h3>
                        </div>

                        {/* 드래그&드롭 영역 */
                        }
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 mb-4 transition-all duration-200 ${!isUploadEnabled
                                    ? 'border-gray-200 bg-gray-100 opacity-50'
                                    : isDragActive
                                        ? 'border-[#005de9] bg-blue-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            {isDragActive ? (
                                <div className="text-blue-600">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="font-medium">Drop your file here</p>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="font-medium mb-1">Drag and drop your file or</p>
                                    <button
                                        onClick={handleUploadButtonClick}
                                        disabled={uploadState.isUploading || !isUploadEnabled}
                                        className={`font-medium underline transition-colors ${isUploadEnabled && !uploadState.isUploading
                                                ? "text-[#005ed9] hover:text-blue-700"
                                                : "text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {loading ? "Checking data..." :
                                            exists === true ? "Data already exists" :
                                                "click here to select"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 업로드 중 상태 표시 */}
                        {(uploadState.isUploading || uploadState.isProcessing) && (
                            <div className="flex items-center justify-center gap-2 text-blue-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm">
                                    {uploadState.isProcessing ? `Processing... ${uploadState.progress}%` : 'Uploading...'}
                                </span>
                            </div>
                        )}

                        {/* 지원 파일 형식 안내 */}
                        <div className="text-xs text-gray-400 mt-4">
                            Supported formats: .xlsx, .xls, .csv (max 50MB)
                        </div>
                    </div>
                </div>
            )}

            {/* 드래그 오버레이 */}
            {isDragActive && (
                <div className="absolute inset-0 bg-[#005de9] bg-opacity-10 border-2 border-[#005de9] border-dashed z-20 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                        <div className="text-blue-600 text-center">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="font-semibold">Drop your file here</p>
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

// React.memo로 감싸서 불필요한 리렌더링 방지
export const FileUploadSheetRender = React.memo(FileUploadSheetRenderComponent);