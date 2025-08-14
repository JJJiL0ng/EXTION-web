"use client";
import React, { useState, useRef } from 'react';
import { Send, Paperclip, Settings, ChevronDown, X } from 'lucide-react';
import { useChatVisibility } from '@/_contexts/ChatVisibilityContext';

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
                className="flex items-center gap-1 px-3 py-0 text-sm text-white rounded-md transition-colors duration-200"
                style={{ backgroundColor: '#005ed9' }}
                onClick={hideChat}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.33-3.83-.91L4 20l.91-4.17C4.33 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                                    <circle cx="8.5" cy="12" r="1"/>
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="15.5" cy="12" r="1"/>
                                </svg>
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