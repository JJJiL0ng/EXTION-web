'use client'

import React, { useRef } from 'react';
import { Send, FunctionSquare, BarChart3, Paperclip } from 'lucide-react';

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
    toggleFormulaMode: () => void;
    toggleArtifactMode: () => void;
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
    toggleFormulaMode,
    toggleArtifactMode,
    handleFileInputChange
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };
    
    return (
        <div className="border-t border-gray-100 bg-white p-2">
            <div
                className={`relative border-2 border-dashed rounded-xl transition-all ${isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : currentMode === 'formula'
                        ? 'border-blue-200 bg-blue-50'
                        : currentMode === 'artifact'
                            ? 'border-indigo-200 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
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
                        placeholder={
                            currentMode === 'formula'
                                ? "스프레드시트 함수에 반영 할 명령을 입력하세요..."
                                : currentMode === 'artifact'
                                    ? "데이터 분석을 위한 요청을 입력하세요..."
                                    : "파일을 첨부하거나 질문을 입력하세요..."
                        }
                        className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder-gray-500"
                        disabled={isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || isArtifactModalOpen}
                    />

                    {/* 아티팩트 버튼 */}
                    <button
                        onClick={toggleArtifactMode}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${currentMode === 'artifact'
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                        title={currentMode === 'artifact' ? "일반 채팅 모드로 전환" : "아티팩트 모드로 전환"}
                    >
                        <BarChart3 className="h-5 w-5" />
                    </button>

                    {/* 포뮬러 버튼 */}
                    <button
                        onClick={toggleFormulaMode}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${currentMode === 'formula'
                            ? 'bg-[#005DE9] text-white'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                        title={currentMode === 'formula' ? "일반 채팅 모드로 전환" : "포뮬러 모드로 전환"}
                    >
                        <FunctionSquare className="h-5 w-5" />
                    </button>

                    <button
                        onClick={onSendMessage}
                        disabled={!inputValue.trim() || isLoading || loadingStates.formulaGeneration || loadingStates.artifactGeneration || isArtifactModalOpen}
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
                    {currentMode === 'formula'
                        ? "포뮬러 모드: 자연어로 스프레드시트 함수를 생성하세요"
                        : currentMode === 'artifact'
                            ? "아티팩트 모드: 데이터 분석 결과를 시각화하세요"
                            : "CSV 또는 XLSX 파일을 드래그하여 업로드하거나 클립 아이콘을 클릭하세요"
                    }
                </p>
            )}
        </div>
    );
} 