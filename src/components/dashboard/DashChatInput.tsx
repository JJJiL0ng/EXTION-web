'use client'

import React from 'react';
import { Send } from 'lucide-react';

interface DashChatInputProps {
    inputValue: string;
    isLoading: boolean;
    loadingStates: any;
    isArtifactModalOpen: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onCompositionStart: () => void;
    onCompositionEnd: () => void;
    onSendMessage: () => void;
}

export default function DashChatInput({
    inputValue,
    isLoading,
    loadingStates,
    isArtifactModalOpen,
    onInputChange,
    onKeyPress,
    onCompositionStart,
    onCompositionEnd,
    onSendMessage
}: DashChatInputProps) {
    return (
        <div className="flex-1 relative">
            <div className="flex items-center bg-white border-2 border-[#005DE9] rounded-full shadow-sm hover:border-[#0052d1] transition-all px-4 py-3">
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
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-[#005DE9] hover:bg-[#0052d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2"
                >
                    <Send className="h-4 w-4 text-white" />
                </button>
            </div>
        </div>
    );
}