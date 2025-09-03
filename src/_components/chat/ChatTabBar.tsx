"use client";
import React, { useState, useRef } from 'react';
import { Send, Paperclip, Settings, ChevronDown, X, MessagesSquare } from 'lucide-react';
import { useChatVisibility } from '@/_contexts/ChatVisibilityContext';
import { useMainAiChatController } from '@/_hooks/aiChat/useAiChatController';

const ChatTabBar = () => {
    const [activeTab, setActiveTab] = useState('chat');
    const tabBarRef = useRef<HTMLDivElement>(null);
    const { hideChat } = useChatVisibility();

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        <div>
            <div
            ref={tabBarRef}
            className="px-2 flex items-center space-x-4 h-6"
            style={{ minHeight: '1.5rem' }} // 40px for better vertical alignment
            >
            <button 
                className="flex items-center gap-1 px-2 py-0 text-sm text-white rounded-md transition-colors duration-200"
                style={{ backgroundColor: '#005ed9' }}
                onClick={hideChat}
            >
                <img src="/EXTION_new_logo_white.svg" alt="Extion Logo" className="w-4 h-4" />
                
                AI
            </button>
            <div className="flex-1" />
            {/* <button
                className={`py-0 rounded ${activeTab === 'settings' ? 'text-white' : 'text-gray-700'} flex items-center h-full`}
                onClick={() => handleTabClick('settings')}
            >
                <Settings size={18} />
            </button> */}
            <button
                className={`pr-2 py-0 rounded ${activeTab === 'settings' ? 'text-white' : 'text-gray-700'} flex items-center h-full`}
                onClick={hideChat}
            >
                <X size={18} />
            </button>
            </div>
        </div>

    );
}
export default ChatTabBar;