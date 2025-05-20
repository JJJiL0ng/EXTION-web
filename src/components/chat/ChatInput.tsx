'use client'

import React, { useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
    currentMode: 'normal' | 'formula' | 'artifact' | 'datageneration';
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
    
    // 현재 모드에 따른 배경색과 테두리 색상 
    const getModeStyling = () => {
        if (isDragOver) return 'border-blue-400 bg-blue-50';
        
        switch (currentMode) {
            case 'formula': return 'border-blue-200 bg-blue-50';
            case 'artifact': return 'border-indigo-200 bg-indigo-50';
            case 'datageneration': return 'border-sky-200 bg-sky-50';
            default: return 'border-gray-200 bg-gray-50 hover:border-gray-300';
        }
    };
    
    // 현재 모드에 따른 플레이스홀더 텍스트
    const getPlaceholderText = () => {
        switch (currentMode) {
            case 'formula': return "스프레드시트 함수에 반영 할 명령을 입력하세요...";
            case 'artifact': return "데이터 분석을 위한 요청을 입력하세요...";
            case 'datageneration': return "데이터 생성 또는 수정을 위한 요청을 입력하세요...";
            default: return "파일을 첨부하거나 질문을 입력하세요...";
        }
    };
    
    return (
        <div className="border-t border-gray-100 bg-white p-2">
            <div
                className={`relative border-2 border-dashed rounded-xl transition-all ${getModeStyling()}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className="flex items-center space-x-2 p-2">
                    {/* 파일 첨부 버튼 */}
                    <button
                        onClick={handleFileButtonClick}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white transition-colors group"
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
                        placeholder={getPlaceholderText()}
                        className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder-gray-500"
                        disabled={isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || loadingStates.dataGeneration || isArtifactModalOpen}
                    />

                    <button
                        onClick={onSendMessage}
                        disabled={!inputValue.trim() || isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || loadingStates.dataGeneration || isArtifactModalOpen}
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
                <p className="text-xs text-gray-500 mt-1 text-center">
                    {currentMode === 'normal' 
                        ? "CSV 또는 XLSX 파일을 드래그하여 업로드하거나 클립 아이콘을 클릭하세요" 
                        : `현재 ${
                            currentMode === 'formula' ? '포뮬러' : 
                            currentMode === 'artifact' ? '아티팩트' : '데이터 생성'
                          } 모드입니다`
                    }
                </p>
            )}
        </div>
    );
} 