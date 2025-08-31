import React from 'react';

interface ChatButtonProps {
    onClick: () => void;
    isVisible: boolean;
}

/**
 * AI 채팅 버튼 컴포넌트
 */
export const ChatButton: React.FC<ChatButtonProps> = ({ onClick, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="ml-auto py-3 transition-all duration-500 ease-in-out opacity-100 translate-x-0 scale-100 pr-2">
            <button
                onClick={onClick}
                style={{ backgroundColor: '#005ed9' }}
                className="flex items-center gap-1 px-2 py-0 text-sm text-white bg-gray-500 hover:bg-[#005ed9] rounded-md transition-all duration-200 hover:scale-105"
            >
                <img src="/EXTION_new_logo_white.svg" alt="Extion Logo" className="w-4 h-4" />
                AI
            </button>
        </div>
    );
};