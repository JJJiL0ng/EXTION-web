import React from 'react';

interface StatusDisplayProps {
    // 업로드 상태
    uploadState: {
        isUploading: boolean;
        isProcessing: boolean;
        progress: number;
        error?: string | null;
    };

    // 내보내기 상태  
    exportState: {
        isExporting: boolean;
        error?: string | null;
        lastExportedAt?: Date | null;
    };

    // 생성 상태
    isCreating: boolean;
    createError?: string | null;

    // 델타 매니저 상태
    deltaManager: {
        state: {
            isProcessing: boolean;
            isPending: boolean;
            queuedDeltas: number;
            failedDeltas: any[];
            error?: string | null;
            lastSyncAt?: string | null;
        };
        retryFailedDeltas: () => void;
        clearFailedDeltas: () => void;
    };
}

/**
 * 상태 표시 영역 컴포넌트
 */
export const StatusDisplay: React.FC<StatusDisplayProps> = ({
    uploadState,
    exportState,
    isCreating,
    createError,
    deltaManager
}) => {
    return (
        <div className="flex items-center space-x-4">
            {/* 업로드/저장/생성 상태 */}
            {(uploadState.isUploading || uploadState.isProcessing || exportState.isExporting || isCreating) && (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">
                        {isCreating ? '스프레드시트 생성 중...' :
                            exportState.isExporting ? '저장 중...' :
                                uploadState.isProcessing ? `처리 중... ${uploadState.progress}%` : '업로드 중...'}
                    </span>
                    {uploadState.progress > 0 && !exportState.isExporting && !isCreating && (
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${uploadState.progress}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            )}

            {/* 델타 자동저장 상태 */}
            {(deltaManager.state.isProcessing || deltaManager.state.isPending) && (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
                    <span className="text-xs text-gray-600">
                        {deltaManager.state.isProcessing ? '동기화 중...' :
                            `변경사항 ${deltaManager.state.queuedDeltas}개 대기`}
                    </span>
                </div>
            )}

            {/* 델타 실패 상태 */}
            {deltaManager.state.failedDeltas.length > 0 && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={deltaManager.retryFailedDeltas}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded"
                        title="동기화 실패한 변경사항 재시도"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        실패 {deltaManager.state.failedDeltas.length}개
                    </button>
                </div>
            )}

            {/* 마지막 저장 시간 */}
            {(exportState.lastExportedAt || deltaManager.state.lastSyncAt) && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                        {deltaManager.state.lastSyncAt ?
                            `동기화: ${new Date(deltaManager.state.lastSyncAt).toLocaleTimeString()}` :
                            `저장: ${exportState.lastExportedAt?.toLocaleTimeString()}`
                        }
                    </span>
                </div>
            )}

            {/* 오류 상태 */}
            {(uploadState.error || exportState.error || createError || deltaManager.state.error) && (
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-red-600 font-medium">
                        {deltaManager.state.error || createError || uploadState.error || exportState.error}
                    </span>
                    {deltaManager.state.error && (
                        <button
                            onClick={deltaManager.clearFailedDeltas}
                            className="text-xs text-red-500 hover:text-red-700 underline ml-2"
                        >
                            닫기
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};