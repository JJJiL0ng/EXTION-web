"use client";

import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../../_hooks/chat/useChatStore';
import { StreamingMarkdown } from './message/StreamingMarkdown';
import { FileUploadWelcomeMessage } from './FileUploadWelcomeMessage';
import { ChatInitMode, MessageType } from '../../_types/chat.types';
import { getOrCreateGuestId } from '../../_utils/guestUtils';

interface ChatViewerProps {
  userId?: string;
}

const ChatViewer: React.FC<ChatViewerProps> = ({ userId = getOrCreateGuestId() }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // V2 스토어에서 직접 데이터 가져오기
  const { messages, error, initMode, fileInfo } = useChatStore();

  // 새 메시지가 올 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-viewer h-full flex flex-col">
      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          // 파일 업로드 모드면 파일 업로드 환영 메시지, 아니면 기본 메시지
          initMode === ChatInitMode.FILE_UPLOAD ? (
            <FileUploadWelcomeMessage fileInfo={fileInfo || undefined} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">새로운 대화를 시작해보세요</div>
                <div className="text-sm">아래 입력창에 메시지를 입력하세요</div>
              </div>
            </div>
          )
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === MessageType.USER ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-2 ${
                  message.type === MessageType.USER
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === MessageType.USER ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <StreamingMarkdown
                    content={message.content}
                    isStreaming={message.status === 'streaming'}
                    className="text-gray-900"
                  />
                )}
                
                {/* 메시지 타임스탬프 */}
                <div
                  className={`text-xs mt-1 ${
                    message.type === MessageType.USER ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* 오류 메시지 표시 */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2 text-red-700">
              <div className="font-medium">오류가 발생했습니다</div>
              <div className="text-sm">{error.message}</div>
            </div>
          </div>
        )}
        
        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatViewer;