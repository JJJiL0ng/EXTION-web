'use client'

import React, { useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { ChatMode } from '@/types/chat';

interface ChatInputProps {
    currentMode: ChatMode;
    inputValue: string;
    isDragOver: boolean;
    isLoading: boolean;
    loadingStates: any;
    isArtifactModalOpen: boolean;
    fileExists: boolean;
    hasUploadedFile: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onCompositionStart: () => void;
    onCompositionEnd: () => void;
    onSendMessage: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ChatInput({
    inputValue,
    isDragOver,
    isLoading,
    loadingStates,
    isArtifactModalOpen,
    fileExists,
    hasUploadedFile,
    onInputChange,
    onKeyPress,
    onCompositionStart,
    onCompositionEnd, 
    onSendMessage,
    onDragOver,
    onDragLeave,
    onDrop,
    handleFileInputChange
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // 디버깅: 파일 업로드 상태 추적
    React.useEffect(() => {
        console.log('📎 ChatInput - hasUploadedFile 상태:', {
            hasUploadedFile,
            fileExists,
            shouldShowFileButton: !hasUploadedFile
        });
    }, [hasUploadedFile, fileExists]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const maxHeight = 200;

            if (scrollHeight > maxHeight) {
                textareaRef.current.style.height = `${maxHeight}px`;
                textareaRef.current.style.overflowY = 'auto';
            } else {
                textareaRef.current.style.height = `${scrollHeight}px`;
                textareaRef.current.style.overflowY = 'hidden';
            }
        }
    }, [inputValue]);
    
    const handleFileButtonClick = () => {
        if (hasUploadedFile) {
            console.log('⚠️ 이미 파일이 업로드되어 새로운 파일을 업로드할 수 없습니다.');
            return;
        }
        console.log('📎 파일 선택 버튼 클릭됨');
        fileInputRef.current?.click();
    };
    
    return (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start space-x-3">
                {/* 파일 첨부 버튼 - 파일이 업로드되지 않았을 때만 표시 */}
                {!hasUploadedFile && (
                    <div
                        className={`w-14 h-14 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                            isDragOver 
                                ? 'border-[#0052d1] bg-blue-50' 
                                : 'border-[#005DE9] bg-white hover:border-[#0052d1] hover:bg-blue-50'
                        }`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={handleFileButtonClick}
                    >
                        <Paperclip className="h-5 w-5 text-[#005DE9] hover:text-[#0052d1]" />
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                    </div>
                )}

                {/* 입력창 - 파일 업로드 여부에 따라 공간 조정 */}
                <div className="flex-1 relative">
                    <div className="flex items-end bg-white border-2 border-[#005DE9] rounded-2xl shadow-sm hover:border-[#0052d1] transition-all px-4 py-3">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={inputValue}
                            onChange={onInputChange}
                            onKeyDown={onKeyPress}
                            onCompositionStart={onCompositionStart}
                            onCompositionEnd={onCompositionEnd}
                            placeholder={hasUploadedFile ? "원하는 수정사항이나 질문을 입력하세요" : "← 왼쪽 버튼을 눌러 파일을 먼저 업로드해주세요"}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500 resize-none pr-2 py-1.5"
                            disabled={!hasUploadedFile || isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || loadingStates.dataGeneration || loadingStates.dataFix || isArtifactModalOpen}
                        />

                        <button
                            onClick={onSendMessage}
                            disabled={!hasUploadedFile || !inputValue.trim() || isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || loadingStates.dataGeneration || loadingStates.dataFix || isArtifactModalOpen}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#005DE9] hover:bg-[#0052d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2 flex-shrink-0"
                        >
                            <Send className="h-4 w-4 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 