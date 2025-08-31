"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChatStore } from '../../_hooks/chat/useChatStore';
import { StreamingMarkdown } from './message/StreamingMarkdown';
import { FileUploadWelcomeMessage } from './FileUploadWelcomeMessage';
import TypingIndicator from './TypingIndicator';
import ReasoningPreview from './ReasoningPreview';
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
  // [ChatIntentType.EXCEL_FORMULA]: {
  //   component: React.lazy(() => import('./message/formulaMessage')),
  //   // hook: useFormulaMessage // 필요시 추가
  // },
};

// 구조화된 응답 렌더러 컴포넌트
const StructuredResponseRenderer: React.FC<{ message: AssistantMessage }> = ({ message }) => {
  const structuredContent = message.structuredContent;
  
  // Debug log removed for production
  
  if (!structuredContent) {
    // 구조화된 응답이 없으면 기본 마크다운 렌더링
    // Debug log removed for production
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
    // Debug log removed for production
    
    if (content.originalData?.formulaDetails || 
        content.formulaName || 
        content.formulaSyntax ||
        content.spreadjsCommand ||
        content.name || // formulaDetails.name
        content.syntax) { // formulaDetails.syntax
      detectedIntent = ChatIntentType.EXCEL_FORMULA;
      // Debug log removed for production
    } else if (content.originalData?.codeGenerator || 
               content.pythonCode) {
      detectedIntent = ChatIntentType.PYTHON_CODE_GENERATOR;
      // Debug log removed for production
    } else if (content.originalData?.dataTransformation ||
               content.transformedJsonData ||
               content.answerAfterReadWholedata ||
               content.answerAfterReadWholeData) {
      detectedIntent = ChatIntentType.WHOLE_DATA;
      // Debug log removed for production
    } else if (content.originalData?.generalHelp ||
               content.directAnswer) {
      detectedIntent = ChatIntentType.GENERAL_HELP;
      // Debug log removed for production
    }
  } else {
    // Debug log removed for production
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
    
    // console.log('📝 [StructuredResponseRenderer] Using default markdown for:', {
    //   intent: detectedIntent,
    //   hasAnswerAfterReadWholeData: !!content.answerAfterReadWholeData,
    //   hasAnswerAfterReadWholedata: !!content.answerAfterReadWholedata,
    //   contentPreview: displayContent.substring(0, 100) + '...'
    // });
    
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
    // Warning log removed for production
    return (
      <StreamingMarkdown
        content={message.content}
        isStreaming={message.status === 'streaming'}
        className="text-gray-900"
      />
    );
  }

  // console.log('🎯 [StructuredResponseRenderer] Using specialized component for intent:', detectedIntent);
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
  const [isScrollingToBottom, setIsScrollingToBottom] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [userScrollIntent, setUserScrollIntent] = useState<'none' | 'up' | 'manual_bottom'>('none');
  
  // V2 스토어에서 직접 데이터 가져오기
  const { 
    messages, 
    error, 
    initMode, 
    fileInfo, 
    isLoading, 
    isStreaming,
    getReasoningPreview,
    getReasoningComplete 
  } = useChatStore();

  // Reasoning preview 상태 가져오기
  const reasoningPreview = getReasoningPreview();
  const reasoningComplete = getReasoningComplete();

  // 스크롤이 맨 아래에 있는지 확인하는 함수
  const isAtBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 50; // 50px 여유분으로 더 정확한 감지
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, []);

  // 자동 스크롤 함수 (애니메이션 강화)
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' | 'instant' = 'smooth') => {
    if (messagesEndRef.current && isAutoScrollEnabled) {
      if (behavior === 'instant') {
        // 즉시 스크롤 (애니메이션 없음)
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      } else {
        // 부드러운 스크롤 애니메이션
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }
  }, [isAutoScrollEnabled]);

  // 강제 스크롤 함수 (자동 스크롤 상태와 관계없이 실행)
  const forceScrollToBottom = useCallback((animated: boolean = true) => {
    if (chatContainerRef.current && messagesEndRef.current) {
      if (animated) {
        // 스크롤 애니메이션 시작 표시
        setIsScrollingToBottom(true);
        
        // 더 부드러운 애니메이션을 위해 직접 스크롤 제어
        const container = chatContainerRef.current;
        const targetScrollTop = container.scrollHeight - container.clientHeight;
        
        // 현재 위치에서 목표 위치까지의 거리 계산
        const currentScrollTop = container.scrollTop;
        const distance = targetScrollTop - currentScrollTop;
        
        // 거리가 짧으면 기본 smooth 스크롤, 길면 더 빠른 애니메이션
        if (Math.abs(distance) < 500) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
          // 스크롤 완료 후 상태 초기화
          setTimeout(() => setIsScrollingToBottom(false), 500);
        } else {
          // 긴 거리는 더 빠른 커스텀 애니메이션 (슝! 효과)
          const duration = 800; // 0.8초로 조금 더 길게
          const startTime = performance.now();
          
          // Debug log removed for production
          
          const animateScroll = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // easeOutQuart 이징 함수로 변경 (더 빠른 시작, 부드러운 끝)
            const easeOutQuart = (t: number) => {
              return 1 - Math.pow(1 - t, 4);
            };
            
            const easedProgress = easeOutQuart(progress);
            const currentPos = currentScrollTop + (distance * easedProgress);
            
            container.scrollTop = currentPos;
            
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            } else {
              // 애니메이션 완료
              setIsScrollingToBottom(false);
              // Debug log removed for production
            }
          };
          
          requestAnimationFrame(animateScroll);
        }
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        setIsScrollingToBottom(false);
      }
    }
  }, []);

  // 사용자 스크롤 감지 핸들러 (개선된 로직)
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const currentScrollTop = container.scrollTop;
    const atBottom = isAtBottom();
    
    // 사용자가 스크롤 중이라고 표시
    setIsUserScrolling(true);
    
    // 스크롤 방향 감지 (위로 스크롤했는지)
    const scrollingUp = currentScrollTop < lastScrollTop;
    
    // 사용자가 능동적으로 위로 스크롤했을 때만 자동 스크롤 해제
    if (scrollingUp && !atBottom && isAutoScrollEnabled) {
      setIsAutoScrollEnabled(false);
      setUserScrollIntent('up');
    }
    
    // 사용자가 맨 아래로 수동으로 돌아왔을 때는 즉시 재활성화하지 않음
    // (맨 아래로 가기 버튼을 통해서만 재활성화되도록)
    
    // 현재 스크롤 위치 저장
    setLastScrollTop(currentScrollTop);

    // 스크롤이 멈췄음을 감지하기 위한 타이머
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 100); // 150ms → 100ms로 더 빠른 반응
  }, [isAtBottom, isAutoScrollEnabled, lastScrollTop]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // // 디버깅용 콘솔 로그
  // useEffect(() => {
  //   console.log('🔍 [ChatViewer] State Debug:', {
  //     isLoading,
  //     isStreaming,
  //     messagesLength: messages.length,
  //     hasMessages: messages.length > 0,
  //     shouldShowIndicator: isStreaming && messages.length > 0,
  //     lastMessage: messages[messages.length - 1]?.type,
  //     lastMessageStatus: messages[messages.length - 1]?.status,
  //     reasoningPreview: reasoningPreview ? reasoningPreview.substring(0, 50) + '...' : null,
  //     reasoningComplete,
  //     hasReasoningPreview: !!reasoningPreview,
  //     isAutoScrollEnabled,
  //     isUserScrolling,
  //     timestamp: new Date().toISOString()
  //   });
  // }, [isLoading, isStreaming, messages, reasoningPreview, reasoningComplete, isAutoScrollEnabled, isUserScrolling]);

  // 새 메시지가 올 때마다 자동 스크롤 처리
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // 새로운 사용자 메시지가 추가되면 무조건 맨 아래로 애니메이션 스크롤
    if (lastMessage && lastMessage.type === MessageType.USER) {
      // Debug log removed for production
      setIsAutoScrollEnabled(true);
      // 강제 스크롤 (애니메이션 포함)
      forceScrollToBottom(true);
      return;
    }

    // 그 외의 경우는 자동 스크롤이 활성화된 경우에만 스크롤
    if (isAutoScrollEnabled && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, isAutoScrollEnabled, isUserScrolling, scrollToBottom, forceScrollToBottom]);

  // 스트리밍 시작 시 한번만 스크롤하고 이후 사용자 의도 존중
  const [hasScrolledForStreaming, setHasScrolledForStreaming] = useState(false);
  
  useEffect(() => {
    if (isStreaming && !hasScrolledForStreaming) {
      // 스트리밍이 처음 시작될 때만 한번 스크롤
      setHasScrolledForStreaming(true);
      forceScrollToBottom(true); // 부드러운 애니메이션으로 한번만
    } else if (!isStreaming) {
      // 스트리밍이 끝나면 플래그 리셋
      setHasScrolledForStreaming(false);
    }
    
    // 스트리밍 중이고 자동 스크롤이 활성화된 경우에만 계속 스크롤
    if (isStreaming && isAutoScrollEnabled && !isUserScrolling) {
      scrollToBottom('auto'); // 스트리밍 중에는 즉시 스크롤
    }
  }, [isStreaming, isAutoScrollEnabled, isUserScrolling, hasScrolledForStreaming, scrollToBottom, forceScrollToBottom]);

  return (
    <div className="chat-viewer h-full flex flex-col relative">
      <div className="border-b-2 border-[#D9D9D9]"></div>
      
      {/* 메시지 리스트 */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto p-2 space-y-3 transition-all duration-300 ${
          isScrollingToBottom ? 'blur-sm' : ''
        }`}
        style={{
          scrollBehavior: 'smooth',
          scrollPaddingBottom: '20px'
        }}
      >
        {messages.length === 0 ? (
          // 파일 업로드 모드면 파일 업로드 환영 메시지, 아니면 기본 메시지
          initMode === ChatInitMode.FILE_UPLOAD ? (
            <FileUploadWelcomeMessage fileInfo={fileInfo || undefined} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-700">
              <div className="text-center">
              <img
                src="/EXTION_new_logo.svg"
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
                  // className={`w-full rounded-lg px-4 py-2 border ${
                  //   message.type === MessageType.USER
                  //     ? 'bg-white text-gray-900 border-gray-300'
                  //     : 'bg-gray-100 text-gray-900 border-gray-300'
                  // }`}
                   className={`w-full rounded-lg px-4 py-2  ${
                    message.type === MessageType.USER
                      ? 'bg-white text-gray-900 border border-gray-300'
                      : ''
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
        
        {/* AI 추론 과정 표시 - TypingIndicator와 분리 */}
        {reasoningPreview && (
          <div className="flex justify-start">
            <div className="px-2">
              <ReasoningPreview
                reasoning={reasoningPreview}
                isComplete={reasoningComplete}
              />
            </div>
          </div>
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
      
      {/* 자동 스크롤 비활성화 시 맨 아래로 가기 버튼 (개선된 버전) */}
      {!isAutoScrollEnabled && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => {
              setIsAutoScrollEnabled(true);
              setUserScrollIntent('manual_bottom');
              forceScrollToBottom(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group hover:scale-105"
            title="최신 메시지로 이동하고 자동 스크롤 활성화"
          >
            <svg className="w-5 h-5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {(isStreaming || (messages.length > 0 && messages[messages.length - 1]?.status === 'streaming')) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatViewer;