'use client'

import React, { useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
    currentMode: 'normal' | 'formula' | 'artifact' | 'datageneration' | 'datafix';
    inputValue: string;
    isDragOver: boolean;
    isLoading: boolean;
    loadingStates: any;
    isArtifactModalOpen: boolean;
    fileExists: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    currentMode,
    inputValue,
    isDragOver,
    isLoading,
    loadingStates,
    isArtifactModalOpen,
    fileExists,
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
    
    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };
    
    return (
        <div className="border-t border-gray-100 bg-white p-4">
            <div
                className={`relative border rounded-xl shadow-sm transition-all ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className="flex items-center space-x-2 p-2">
                    {/* 파일 첨부 버튼 */}
                    <button
                        onClick={handleFileButtonClick}
                        className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors group"
                        aria-label="파일 첨부"
                    >
                        <Paperclip className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                    </button>
                    
                    <input
                        type="text"
                        value={inputValue}
                        onChange={onInputChange}
                        onKeyDown={onKeyPress}
                        onCompositionStart={onCompositionStart}
                        onCompositionEnd={onCompositionEnd}
                        placeholder="데이터와 대화해보세요"
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500"
                        disabled={isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || loadingStates.dataGeneration || loadingStates.dataFix || isArtifactModalOpen}
                    />

                    <button
                        onClick={onSendMessage}
                        disabled={!inputValue.trim() || isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || loadingStates.dataGeneration || loadingStates.dataFix || isArtifactModalOpen}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#005DE9] hover:bg-[#0052d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
            />

            {!fileExists && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                    CSV 또는 XLSX 파일을 드래그하여 업로드하거나 클립 아이콘을 클릭하세요
                </p>
            )}
        </div>
    );
} 