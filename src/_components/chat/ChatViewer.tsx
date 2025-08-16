"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChatStore } from '../../_hooks/chat/useChatStore';
import { StreamingMarkdown } from './message/StreamingMarkdown';
import { FileUploadWelcomeMessage } from './FileUploadWelcomeMessage';
import TypingIndicator from './TypingIndicator';
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
};

// 구조화된 응답 렌더러 컴포넌트
const StructuredResponseRenderer: React.FC<{ message: AssistantMessage }> = ({ message }) => {
  const structuredContent = message.structuredContent;
  
  console.log('🔍 [StructuredResponseRenderer] Processing message:', {
    messageId: message.id,
    hasStructuredContent: !!structuredContent,
    structuredContent: structuredContent,
    messageContent: message.content.substring(0, 100) + '...'
  });
  
  if (!structuredContent) {
    // 구조화된 응답이 없으면 기본 마크다운 렌더링
    console.log('📝 [StructuredResponseRenderer] No structured content, using markdown');
    return (
      <StreamingMarkdown
        content={message.content}
        isStreaming={message.status === 'streaming'}
        className="text-gray-900"
      />
    );
  }

  // intent가 있는 경우 사용, 없으면 폴백 로직으로 감지
  let detectedIntent = (structuredContent as any).intent;
  
  if (!detectedIntent) {
    // 폴백 로직: 필드를 기반으로 intent 감지
    const content = structuredContent as any;
    console.log('🔄 [StructuredResponseRenderer] No intent found, trying fallback detection:', {
      hasFormulaDetails: !!content.originalData?.formulaDetails,
      hasFormulaName: !!content.formulaName,
      hasName: !!content.name,
      hasSyntax: !!content.syntax,
      contentKeys: Object.keys(content)
    });
    
    if (content.originalData?.formulaDetails || 
        content.formulaName || 
        content.formulaSyntax ||
        content.spreadjsCommand ||
        content.name || // formulaDetails.name
        content.syntax) { // formulaDetails.syntax
      detectedIntent = ChatIntentType.EXCEL_FORMULA;
      console.log('✅ [StructuredResponseRenderer] Detected Excel formula intent');
    } else if (content.originalData?.codeGenerator || 
               content.pythonCode) {
      detectedIntent = ChatIntentType.PYTHON_CODE_GENERATOR;
      console.log('✅ [StructuredResponseRenderer] Detected Python code generator intent');
    } else if (content.originalData?.dataTransformation ||
               content.transformedJsonData ||
               content.answerAfterReadWholedata ||
               content.answerAfterReadWholeData) {
      detectedIntent = ChatIntentType.WHOLE_DATA;
      console.log('✅ [StructuredResponseRenderer] Detected whole data intent');
    } else if (content.originalData?.generalHelp ||
               content.directAnswer) {
      detectedIntent = ChatIntentType.GENERAL_HELP;
      console.log('✅ [StructuredResponseRenderer] Detected general help intent');
    }
  } else {
    console.log('✅ [StructuredResponseRenderer] Intent found:', detectedIntent);
  }

  // GENERAL_HELP와 WHOLE_DATA는 특별한 컴포넌트가 필요없으므로 기본 마크다운으로 렌더링
  if (detectedIntent === ChatIntentType.GENERAL_HELP || detectedIntent === ChatIntentType.WHOLE_DATA) {
    const content = structuredContent as any;
    
    let displayContent = message.content;
    
    // WHOLE_DATA의 경우 answerAfterReadWholeData 또는 answerAfterReadWholedata를 사용
    if (detectedIntent === ChatIntentType.WHOLE_DATA) {
      if (content.answerAfterReadWholeData?.response) {
        displayContent = content.answerAfterReadWholeData.response;
      } else if (content.answerAfterReadWholedata?.response) {
        displayContent = content.answerAfterReadWholedata.response;
      } else if (typeof content.answerAfterReadWholeData === 'string') {
        displayContent = content.answerAfterReadWholeData;
      } else if (typeof content.answerAfterReadWholedata === 'string') {
        displayContent = content.answerAfterReadWholedata;
      }
    }
    
    console.log('📝 [StructuredResponseRenderer] Using default markdown for:', {
      intent: detectedIntent,
      hasAnswerAfterReadWholeData: !!content.answerAfterReadWholeData,
      hasAnswerAfterReadWholedata: !!content.answerAfterReadWholedata,
      contentPreview: displayContent.substring(0, 100) + '...'
    });
    
    return (
      <StreamingMarkdown
        content={displayContent}
        isStreaming={detectedIntent === ChatIntentType.WHOLE_DATA ? false : message.status === 'streaming'}
        className="text-gray-900"
      />
    );
  }

  const config = detectedIntent ? ResponseComponentRegistry[detectedIntent] : null;
  
  if (!config) {
    // Registry에 없는 타입이면 기본 마크다운 렌더링
    console.warn(`❌ [StructuredResponseRenderer] Unknown or unregistered response intent: ${detectedIntent}`);
    return (
      <StreamingMarkdown
        content={message.content}
        isStreaming={message.status === 'streaming'}
        className="text-gray-900"
      />
    );
  }

  console.log('🎯 [StructuredResponseRenderer] Using specialized component for intent:', detectedIntent);
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  // V2 스토어에서 직접 데이터 가져오기
  const { messages, error, initMode, fileInfo, isLoading, isStreaming } = useChatStore();

  // 스크롤이 맨 아래에 있는지 확인하는 함수
  const isAtBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 100; // 100px 여유분
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, []);

  // 자동 스크롤 함수
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    if (messagesEndRef.current && isAutoScrollEnabled) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [isAutoScrollEnabled]);

  // 사용자 스크롤 감지 핸들러
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;

    const atBottom = isAtBottom();
    
    // 사용자가 스크롤 중이라고 표시
    setIsUserScrolling(true);
    
    // 사용자가 맨 아래에 있으면 자동 스크롤 다시 활성화
    if (atBottom && !isAutoScrollEnabled) {
      setIsAutoScrollEnabled(true);
    }
    // 사용자가 위쪽으로 스크롤했으면 자동 스크롤 비활성화
    else if (!atBottom && isAutoScrollEnabled) {
      setIsAutoScrollEnabled(false);
    }

    // 스크롤이 멈췄음을 감지하기 위한 타이머
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [isAtBottom, isAutoScrollEnabled]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 디버깅용 콘솔 로그
  useEffect(() => {
    console.log('🔍 [ChatViewer] State Debug:', {
      isLoading,
      isStreaming,
      messagesLength: messages.length,
      hasMessages: messages.length > 0,
      shouldShowIndicator: isStreaming && messages.length > 0,
      lastMessage: messages[messages.length - 1]?.type,
      lastMessageStatus: messages[messages.length - 1]?.status,
      isAutoScrollEnabled,
      isUserScrolling,
      timestamp: new Date().toISOString()
    });
  }, [isLoading, isStreaming, messages, isAutoScrollEnabled, isUserScrolling]);

  // 새 메시지가 올 때마다 자동 스크롤 (자동 스크롤이 활성화된 경우에만)
  useEffect(() => {
    if (isAutoScrollEnabled && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, isAutoScrollEnabled, isUserScrolling, scrollToBottom]);

  // 스트리밍 중일 때도 자동 스크롤 적용
  useEffect(() => {
    if (isStreaming && isAutoScrollEnabled && !isUserScrolling) {
      scrollToBottom('auto'); // 스트리밍 중에는 부드러운 스크롤 대신 즉시 스크롤
    }
  }, [isStreaming, isAutoScrollEnabled, isUserScrolling, scrollToBottom]);

  return (
    <div className="chat-viewer h-full flex flex-col relative">
      <div className="border-b-2 border-[#D9D9D9]"></div>
      {/* 메시지 리스트 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-3"
      >
        {messages.length === 0 ? (
          // 파일 업로드 모드면 파일 업로드 환영 메시지, 아니면 기본 메시지
          initMode === ChatInitMode.FILE_UPLOAD ? (
            <FileUploadWelcomeMessage fileInfo={fileInfo || undefined} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-700">
              <div className="text-center">
              <img
                src="/logo.png"
                alt="Extion Logo"
                className="mx-auto mb-4 w-16 h-16"
              />
              <div className="text-xl mb-2">채팅으로 데이터 수정</div>
              <div className="text-sm">아래 입력창에 메시지를 입력하세요</div>
              </div>
            </div>
            )
          ) : (
            messages
            .filter((message) => {
              // AI 메시지가 pending 상태일 때는 숨기기 (타이핑 인디케이터가 대신 표시)
              if (message.type === MessageType.ASSISTANT && message.status === 'pending') {
                return false;
              }
              return true;
            })
            .map((message) => (
            <div
              key={message.id}
              className="w-full"
            >
                <div
                  className={`w-full rounded-lg px-4 py-2 border ${
                    message.type === MessageType.USER
                      ? 'bg-white text-gray-900 border-gray-300'
                      : 'bg-gray-100 text-gray-900 border-gray-300'
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
                      message.type === MessageType.USER ? 'text-blue-900' : 'text-gray-900'
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
        
        {/* 타이핑 인디케이터 - AI 메시지가 pending 상태일 때만 표시 */}
        {(() => {
          const lastMessage = messages[messages.length - 1];
          const hasPendingAIMessage = messages.some(msg => 
            msg.type === MessageType.ASSISTANT && msg.status === 'pending'
          );
          const shouldShow = hasPendingAIMessage && messages.length > 0;
          
          // console.log('🎯 [TypingIndicator] Render Check:', {
          //   isLoading,
          //   isStreaming,
          //   hasPendingAIMessage,
          //   messagesLength: messages.length,
          //   lastMessageType: lastMessage?.type,
          //   lastMessageStatus: lastMessage?.status,
          //   shouldShow,
          //   allMessageStatuses: messages.map(m => ({ type: m.type, status: m.status })),
          //   timestamp: new Date().toISOString()
          // });
          
          return shouldShow ? (
            <div className="flex justify-start">
              <div className="px-4 py-3">
                <TypingIndicator />
              </div>
            </div>
          ) : null;
        })()}
        
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
      
      {/* 자동 스크롤 비활성화 시 맨 아래로 가기 버튼 */}
      {!isAutoScrollEnabled && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => {
              setIsAutoScrollEnabled(true);
              scrollToBottom();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
            title="맨 아래로 이동하고 자동 스크롤 활성화"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatViewer;