"use client";

import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../../_hooks/chat/useChatStore';
import { StreamingMarkdown } from './message/StreamingMarkdown';
import { FileUploadWelcomeMessage } from './FileUploadWelcomeMessage';
import { ChatInitMode, MessageType, AssistantMessage } from '../../_types/chat.types';
import { ChatIntentType } from '../../_types/chat-response.types';
import { getOrCreateGuestId } from '../../_utils/guestUtils';

// Registry Pattern을 위한 타입 정의
interface ResponseComponentConfig {
  component: React.ComponentType<ResponseComponentProps>;
  hook?: () => any;
}

interface ResponseComponentProps {
  message: AssistantMessage;
  onAction?: (action: string, data?: any) => void;
  className?: string;
}

// 응답 타입별 컴포넌트 Registry
const ResponseComponentRegistry: Record<string, ResponseComponentConfig> = {
  // 컴포넌트가 준비되면 주석 해제
  [ChatIntentType.EXCEL_FORMULA]: {
    component: React.lazy(() => import('./message/formulaMessage')),
    // hook: useFormulaMessage // 필요시 추가
  },
  // [ChatIntentType.PYTHON_CODE_GENERATOR]: {
  //   component: React.lazy(() => import('./message/codeGeneratorMessage')),
  //   // hook: useCodeGeneratorMessage // 필요시 추가
  // },
  // [ChatIntentType.WHOLE_DATA]: {
  //   component: React.lazy(() => import('./message/wholeDataMessage')),
  //   // hook: useWholeDataMessage // 필요시 추가
  // },
  // [ChatIntentType.GENERAL_HELP]: {
  //   component: React.lazy(() => import('./message/generalHelpMessage')),
  //   // hook: useGeneralHelpMessage // 필요시 추가
  // }
};

// 구조화된 응답 렌더러 컴포넌트
const StructuredResponseRenderer: React.FC<{ message: AssistantMessage }> = ({ message }) => {
  const structuredContent = message.structuredContent;
  
  if (!structuredContent || !structuredContent.intent) {
    // 구조화된 응답이 없으면 기본 마크다운 렌더링
    return (
      <StreamingMarkdown
        content={message.content}
        isStreaming={message.status === 'streaming'}
        className="text-gray-900"
      />
    );
  }

  const config = ResponseComponentRegistry[structuredContent.intent];
  
  if (!config) {
    // Registry에 없는 타입이면 기본 마크다운 렌더링
    console.warn(`Unknown response intent: ${structuredContent.intent}`);
    return (
      <StreamingMarkdown
        content={message.content}
        isStreaming={message.status === 'streaming'}
        className="text-gray-900"
      />
    );
  }

  const ResponseComponent = config.component;
  
  return (
    <React.Suspense fallback={
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    }>
      <ResponseComponent 
        message={message}
        className="text-gray-900"
      />
    </React.Suspense>
  );
};

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
                  <StructuredResponseRenderer message={message as AssistantMessage} />
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