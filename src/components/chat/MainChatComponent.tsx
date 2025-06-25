'use client'

import React, { useRef, useEffect } from 'react';
import { useUnifiedStore } from '@/stores';
import { LOADING_HINTS } from '@/types/chat';

// 훅들 가져오기
import { useChatState } from '@/hooks/useChatState';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { useChatHandlers } from '@/hooks/useChatHandlers';
import { useChatSession } from '@/hooks/useChatSession';

// 컴포넌트 가져오기
import MessageDisplay from './MessageDisplay';
import FileUploadHandler from './FileUploadHandler';
import ChatInput from './ChatInput';

// NodeJS 타입 정의
declare global {
    namespace NodeJS {
        interface Timeout {}
    }
}

export default function MainChatComponent() {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Zustand 스토어 사용
    const {
        xlsxData,
        loadingStates,
        hasUploadedFile,
        isArtifactModalOpen,
        switchToSheet,
        // 시트별 채팅 관련 스토어 값
        activeSheetMessages,
        clearAllMessages,
        setXLSXData,
    } = useUnifiedStore();

    // 현재 활성 시트 인덱스 가져오기
    const activeSheetIndex = xlsxData?.activeSheetIndex || 0;

    // 커스텀 훅들 사용
    const {
        currentMode,
        loadingState,
        inputState,
        appliedActions,
        setCurrentMode,
        startLoading,
        stopLoading,
        setInputValue,
        setIsComposing,
        clearInput,
        addAppliedDataFix,
        addAppliedFunctionResult
    } = useChatState();



    const {
        fileState,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileInputChange
    } = useFileProcessing(activeSheetIndex);

    const {
        sendMessage,
        handleApplyDataFix,
        handleApplyFunctionResult,
        handleArtifactClick,
        removeFile
    } = useChatHandlers(activeSheetIndex);

    // 세션 관리 훅 사용
    useChatSession();

    // 파일이 로드되었는지 확인
    const file = xlsxData ? { name: xlsxData.fileName } : null;

    // 메시지 전송 래퍼 함수
    const handleSendMessage = async () => {
        if (!inputState.inputValue.trim() || loadingState.isLoading) return;
        
        await sendMessage(
            inputState.inputValue,
            startLoading,
            stopLoading,
            clearInput,
            setCurrentMode
        );
    };

    // 키보드 입력 핸들러
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (inputState.isComposing) return;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputState.inputValue.trim() && !loadingState.isLoading) {
                handleSendMessage();
            }
        }
    };

    // 데이터 수정 적용 핸들러 래퍼
    const handleDataFixApply = (messageId: string) => {
        handleApplyDataFix(
            messageId,
            appliedActions.appliedDataFixes,
            addAppliedDataFix
        );
    };

    // 함수 결과 적용 핸들러 래퍼
    const handleFunctionApply = (messageId: string) => {
        handleApplyFunctionResult(
            messageId,
            appliedActions.appliedFunctionResults,
            addAppliedFunctionResult
        );
    };

    // 새 메시지가 추가되거나 로딩 상태가 변경될 때 스크롤을 맨 아래로 이동하는 효과
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [activeSheetMessages, loadingState.isLoading]);

    // 디버깅: hasUploadedFile 상태 변화 추적
    useEffect(() => {
        console.log('📁 hasUploadedFile 상태 변화:', {
            hasUploadedFile,
            xlsxData: !!xlsxData,
        });
    }, [hasUploadedFile, xlsxData]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <div className="flex flex-col h-full w-full">
                {/* 파일 정보를 채팅 맨 위에 표시 */}
                {xlsxData && (
                    <div className="w-full border-b border-gray-200 bg-gray-50 shadow-sm flex-shrink-0">
                        <div className="w-full max-w-3xl mx-auto">
                            <FileUploadHandler
                                xlsxData={xlsxData}
                                handleDragOver={handleDragOver}
                                handleDragLeave={handleDragLeave}
                                handleDrop={handleDrop}
                                handleFileInputChange={handleFileInputChange}
                                removeFile={removeFile}
                                switchToSheet={switchToSheet}
                            />
                        </div>
                    </div>
                )}

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
                    <MessageDisplay
                        messages={activeSheetMessages}
                        onArtifactClick={handleArtifactClick}
                        onDataFixApply={handleDataFixApply}
                        appliedDataFixes={appliedActions.appliedDataFixes}
                        onFunctionApply={handleFunctionApply}
                        appliedFunctionResults={appliedActions.appliedFunctionResults}
                        isLoading={loadingState.isLoading}
                    />

                    {/* 로딩 진행 표시 */}
                    {loadingState.isLoading && (
                        <div className="mt-4 px-4">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${loadingState.loadingProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                {LOADING_HINTS.hints[loadingState.loadingHintIndex]}
                            </p>
                        </div>
                    )}
                </div>

                <div className="w-full max-w-2xl mx-auto flex-shrink-0">
                    <ChatInput
                        currentMode={currentMode}
                        inputValue={inputState.inputValue}
                        isDragOver={fileState.isDragOver}
                        isLoading={loadingState.isLoading}
                        loadingStates={loadingStates}
                        isArtifactModalOpen={isArtifactModalOpen}
                        fileExists={!!file}
                        hasUploadedFile={hasUploadedFile}
                        onInputChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        onSendMessage={handleSendMessage}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        handleFileInputChange={handleFileInputChange}
                    />
                </div>
            </div>
        </div>
    );
} 