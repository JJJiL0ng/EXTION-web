'use client'

import React, { useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputContainerProps {
    // Chat input props
    inputValue: string;
    isLoading: boolean;
    loadingStates?: any;
    isArtifactModalOpen?: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onCompositionStart: () => void;
    onCompositionEnd: () => void;
    onSendMessage: () => void;
    
    // File upload props
    hasUploadedFile: boolean;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    
    // Optional customization props
    placeholder?: string;
    showFileUpload?: boolean;
    containerClassName?: string;
}

export default function ChatInputContainer({
    inputValue,
    isLoading,
    loadingStates = {},
    isArtifactModalOpen = false,
    onInputChange,
    onKeyPress,
    onCompositionStart,
    onCompositionEnd,
    onSendMessage,
    hasUploadedFile,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    handleFileInputChange,
    placeholder = "데이터와 대화해보세요",
    showFileUpload = true,
    containerClassName = ""
}: ChatInputContainerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileButtonClick = () => {
        if (hasUploadedFile) {
            console.log('이미 파일이 업로드되어 새로운 파일을 업로드할 수 없습니다.');
            return;
        }
        fileInputRef.current?.click();
    };

    const isInputDisabled = isLoading || 
        loadingStates.formulaGeneration || 
        loadingStates.artifactGeneration || 
        loadingStates.dataGeneration || 
        loadingStates.dataFix || 
        isArtifactModalOpen;

    const isSendDisabled = !inputValue.trim() || isInputDisabled;

    return (
        <div className={`flex items-center space-x-4 ${containerClassName}`}>
            {/* File Upload Button */}
            {showFileUpload && (
                <div
                    className={`w-14 h-14 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        hasUploadedFile 
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                            : isDragOver 
                                ? 'border-[#0052d1] bg-blue-50' 
                                : 'border-[#005DE9] bg-white hover:border-[#0052d1] hover:bg-blue-50'
                    }`}
                    onDragOver={hasUploadedFile ? undefined : onDragOver}
                    onDragLeave={hasUploadedFile ? undefined : onDragLeave}
                    onDrop={hasUploadedFile ? undefined : onDrop}
                    onClick={handleFileButtonClick}
                >
                    <Paperclip className={`h-5 w-5 ${
                        hasUploadedFile 
                            ? 'text-gray-400' 
                            : 'text-[#005DE9] hover:text-[#0052d1]'
                    }`} />
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                </div>
            )}

            {/* Chat Input */}
            <div className="flex-1 relative">
                <div className="flex items-center bg-white border-2 border-[#005DE9] rounded-full shadow-sm hover:border-[#0052d1] transition-all px-4 py-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={onInputChange}
                        onKeyDown={onKeyPress}
                        onCompositionStart={onCompositionStart}
                        onCompositionEnd={onCompositionEnd}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500"
                        disabled={isInputDisabled}
                    />

                    <button
                        onClick={onSendMessage}
                        disabled={isSendDisabled}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#005DE9] hover:bg-[#0052d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2"
                    >
                        <Send className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
} 