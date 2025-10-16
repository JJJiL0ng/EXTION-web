'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useScChattingStore } from '@/_aaa_schema-converter/_sc-store/scChattingStore';

// TODO: ChatMode 타입 정의 필요

interface ScChatInputboxProps {
    onSendMessage?: (message: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function ScChatInputbox({
    placeholder = "Enter your changes...",
    disabled = false,
    onSendMessage
}: ScChatInputboxProps) {
    // 채팅 스토어
    const addMessage = useScChattingStore((state) => state.addMessage);

    const [message, setMessage] = useState('');

    const [isFocused, setIsFocused] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // TODO: 실제 연결 상태 확인 필요
    const isConnected = true;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modeModalRef = useRef<HTMLDivElement>(null);
    const modelModalRef = useRef<HTMLDivElement>(null);

    const minHeight = 20;
    const maxHeight = 120;

    // Textarea 높이 자동 조절
    const adjustTextareaHeight = useCallback(() => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;

            if (scrollHeight <= maxHeight) {
                textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
                textarea.style.overflowY = 'hidden';
            } else {
                textarea.style.height = `${maxHeight}px`;
                textarea.style.overflowY = 'auto';
            }
        }
    }, [maxHeight, minHeight]);

    useEffect(() => {
        adjustTextareaHeight();
    }, [message, adjustTextareaHeight]);

    // 메시지 전송 핸들러
    const handleSend = () => {
        if (!message.trim() || disabled || isSendingMessage) return;

        // 유저 메시지를 채팅 스토어에 추가
        addMessage({
            role: 'user',
            content: message,
            contentType: 'user-message'
        });

        // TODO: 실제 메시지 전송 로직 구현 필요
        console.log('Sending message:', { message });

        if (onSendMessage) {
            onSendMessage(message);
        }

        // 메시지 전송 후 입력창 초기화
        setMessage('');
        adjustTextareaHeight();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    };

    return (
        <div className="p-1.5 mx-auto justify-center w-full max-full">
            <div className={`bg-white border-2 ${isFocused ? 'border-[#005de9]' : 'border-gray-200'} rounded transition-colors relative`}>
                {/* 상단 영역 - TODO: 파일 선택 기능 추가 필요 */}
                <div className="px-1.5 py-1.5 flex items-center justify-between relative">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* TODO: FileAddButton 컴포넌트 구현 및 연결 필요 */}
                        {/* TODO: SelectedSheetNameCard 컴포넌트 구현 및 연결 필요 */}
                    </div>
                </div>

                {/* 메인 입력 영역 */}
                <div className="px-2 py-1.5">
                    <textarea
                        id="sc-chat-input-message"
                        name="chatMessage"
                        ref={textareaRef}
                        value={message}
                        onChange={handleMessageChange}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        className="w-full resize-none border-none outline-none text-gray-800 placeholder-gray-400 bg-transparent leading-4"
                        disabled={disabled}
                        style={{
                            minHeight: `${minHeight}px`,
                            maxHeight: `${maxHeight}px`,
                            height: 'auto',
                            overflowY: 'hidden'
                        }}
                    />
                </div>

                {/* 하단 영역 - 컨트롤들 */}
                <div className="p-1.5 flex items-center justify-between relative">
                    <div className="flex items-center">
                    </div>

                    {/* 전송 버튼 */}
                    <button
                        onClick={handleSend}
                        disabled={disabled || isSendingMessage || !message.trim()}
                        className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${disabled || isSendingMessage || !message.trim()
                            ? 'bg-gray-300 text-white cursor-not-allowed'
                            : isConnected
                                ? 'bg-[#005de9] text-white hover:bg-[#004bb7] active:scale-95'
                                : 'bg-gray-500 text-white hover:bg-gray-600 active:scale-95'
                            }`}
                        title={!isConnected ? 'Connecting to AI server...' : 'Send message'}
                    >
                        {isSendingMessage ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
