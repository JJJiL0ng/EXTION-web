"use client";
import React from 'react';
import { PanelRightClose, Settings } from 'lucide-react';
import { useChatVisibilityState } from "@/_aa_superRefactor/store/chat/chatVisibilityStore";




const ChatTabBar = () => {
    const { chatVisability, setChatVisability } = useChatVisibilityState();

    const handleClickCloseChatButton = () => {
        setChatVisability(false);
    }

    return (
        <div>
            <div className="flex items-center justify-between h-7">
                {/* PanelRightClose 버튼 (왼쪽 정렬) */}
                <button
                    onClick={handleClickCloseChatButton}
                    aria-label="panel-close"
                    className="px-2 py-1.5 rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                    <PanelRightClose className="w-5 h-5 text-gray-500 stroke-[1.5]" />
                </button>

                {/* Settings 버튼 (오른쪽 정렬) */}
                <button
                    aria-label="settings"
                    className="px-2 py-1.5 rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                    <Settings className="w-5 h-5 text-gray-500 stroke-[1.5]" />
                </button>
            </div>
            <div className="border-b border-gray-200" />
        </div>
    );
}
export default ChatTabBar;