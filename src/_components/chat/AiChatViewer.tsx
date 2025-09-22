'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { aiChatStore } from "@/_store/aiChat/aiChatStore";
import { ChatMessage } from "@/_types/store/aiChatStore.types";
import { Undo2, ThumbsUp, ThumbsDown } from 'lucide-react';
import useSpreadsheetIdStore from "@/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_store/chat/chatIdAndChatSessionIdStore";

import { getOrCreateGuestId } from '../../_utils/guestUtils';

import TypingIndicator from './TypingIndicator';
import RollbackAlert from './RollbackAlert';

import { useRollbackMessageLoadSheet } from '@/_hooks/rollback/useRollbackMessageLoadSheet';

const AiChatViewer = () => {
  const messages = aiChatStore((state) => state.messages);
  const isSendingMessage = aiChatStore((state) => state.isSendingMessage);
  const rollbackMessage = aiChatStore((state) => state.rollbackMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [messageRatings, setMessageRatings] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [showRollbackAlert, setShowRollbackAlert] = useState(false);
  const [dontShowRollbackAlert, setDontShowRollbackAlert] = useState(false);
  const [pendingRollbackMessageId, setPendingRollbackMessageId] = useState<string | null>(null);

  // 롤백 훅 사용
  const { rollbackMessage: executeBackendRollback, isLoading: isRollbackLoading, error: rollbackError } = useRollbackMessageLoadSheet();


  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.type === 'assistant') {
      const content = message.content;
      const aiChatRes = message.aiChatRes;
      if (typeof content === 'object' && aiChatRes?.dataEditChatRes) {
        return (
          <div>
            <p>{content}</p>
          </div>
        );
      }
    }

    return <div className="whitespace-pre-wrap">{String(message.content)}</div>;
  };

  // 스크롤이 맨 아래에 있는지 확인
  const isAtBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const threshold = 50;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, []);

  // 자동 스크롤 함수
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    if (messagesEndRef.current && isAutoScrollEnabled) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [isAutoScrollEnabled]);

  // 강제 스크롤 함수
  const forceScrollToBottom = useCallback((animated: boolean = true) => {
    if (chatContainerRef.current && messagesEndRef.current) {
      if (animated) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, []);

  // 사용자 스크롤 감지
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const currentScrollTop = container.scrollTop;
    const atBottom = isAtBottom();

    setIsUserScrolling(true);

    // 위로 스크롤했을 때 자동 스크롤 해제
    const scrollingUp = currentScrollTop < lastScrollTop;
    if (scrollingUp && !atBottom && isAutoScrollEnabled) {
      setIsAutoScrollEnabled(false);
    }

    setLastScrollTop(currentScrollTop);

    setTimeout(() => {
      setIsUserScrolling(false);
    }, 100);
  }, [isAtBottom, isAutoScrollEnabled, lastScrollTop]);


  const handleRollBackButtonClick = (messageId?: string) => {
    if (messageId) {
      setPendingRollbackMessageId(messageId);
      if (!dontShowRollbackAlert) {
        setShowRollbackAlert(true);
      } else {
        executeRollback(messageId);
        // useRollbackMessageLoadSheet(apiConnector);
      }
    }
  }

  const executeRollback = async (messageId?: string) => {
    const targetMessageId = messageId || pendingRollbackMessageId;
    if (targetMessageId) {
      console.log('RollBack button clicked for message ID:', targetMessageId);

      try {
        // 필요한 정보 수집
        const spreadsheetId = useSpreadsheetIdStore.getState().spreadsheetId;
        const { chatId, chatSessionId } = useChatStore.getState();

        if (!spreadsheetId) {
          console.error('❌ spreadsheetId가 없습니다');
          return;
        }

        if (!chatId || !chatSessionId) {
          console.error('❌ chatId 또는 chatSessionId가 없습니다');
          return;
        }

        // userId는 현재 Firebase Auth에서 가져와야 할 것 같습니다
        // 임시로 'current-user'를 사용하거나, Firebase Auth 구현이 필요합니다
        const userId = getOrCreateGuestId();

        // 요청 데이터 로깅
        const rollbackRequest = {
          spreadSheetId: spreadsheetId,
          chatId: chatId,
          userId: userId,
          chatSessionId: chatSessionId,
          chatSessionBranchId: targetMessageId, // 롤백 대상 메시지의 chatSessionBranchId
        };

        console.log('🔍 롤백 요청 데이터:', rollbackRequest);

        // 백엔드 롤백 API 호출
        const result = await executeBackendRollback(rollbackRequest);

        if (result) {
          console.log('✅ 백엔드 롤백 성공:', result);
          // 프론트엔드 상태도 롤백
          rollbackMessage(targetMessageId);
        } else {
          console.error('❌ 백엔드 롤백 실패 - result가 null');
        }
      } catch (error) {
        console.error('❌ 롤백 중 오류 발생:', error);
      }

      // 롤백 후 상태 초기화
      setPendingRollbackMessageId(null);
    }
  }

  // 좋아요/싫어요 버튼 핸들러
  const handleRating = (messageId: string, rating: 'like' | 'dislike') => {
    setMessageRatings(prev => {
      const currentRating = prev[messageId];
      if (currentRating === rating) {
        // 같은 버튼을 다시 누르면 선택 취소
        return { ...prev, [messageId]: null };
      } else {
        // 다른 버튼을 누르거나 처음 누르면 해당 평가로 설정
        return { ...prev, [messageId]: rating };
      }
    });
  };

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.type === 'user') {
      setIsAutoScrollEnabled(true);
      forceScrollToBottom(true);
      return;
    }

    if (isAutoScrollEnabled && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, isAutoScrollEnabled, isUserScrolling, scrollToBottom, forceScrollToBottom]);

  // TypingIndicator가 나타날 때 자동 스크롤
  useEffect(() => {
    if (isSendingMessage && isAutoScrollEnabled && !isUserScrolling) {
      // 약간의 지연을 두어 TypingIndicator가 렌더링된 후 스크롤
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
    }
  }, [isSendingMessage, isAutoScrollEnabled, isUserScrolling, scrollToBottom]);

  return (
    <div className="chat-viewer h-full flex flex-col relative">
      <div className="border-b-2 border-[#D9D9D9]"></div>

      {/* 롤백 에러 알림 */}
      {rollbackError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-2 mt-2">
          <div className="flex justify-between items-center">
            <span>An error occurred during rollback: {rollbackError}</span>
            <button
              onClick={() => {
                // 에러 상태 초기화는 다음 롤백 시도 시 자동으로 처리됨
              }}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 롤백 확인 알림창 */}
      <RollbackAlert
        isOpen={showRollbackAlert}
        onClose={() => {
          setShowRollbackAlert(false);
          setPendingRollbackMessageId(null);
        }}
        onConfirm={() => executeRollback()}
        dontShowAgain={dontShowRollbackAlert}
        onDontShowAgainChange={setDontShowRollbackAlert}
      />

      {/* 메시지 리스트 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-3"
        style={{
          scrollBehavior: 'smooth',
          scrollPaddingBottom: '20px'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-700">
            <div className="text-center">
              <Image
                src="/EXTION_new_logo.svg"
                alt="Extion Logo"
                width={64}
                height={64}
                className="mx-auto mb-4"
              />
              <div className="text-xl mb-2">Edit Data with Chat</div>
              <div className="text-sm">Enter your message in the input field below</div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={message.id} className="w-full">
                <div
                  className={`w-full rounded-lg px-2 py-2 ${message.type === 'user'
                      ? 'bg-white text-gray-900 border border-gray-300'
                      : ''
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {renderMessageContent(message)}
                    </div>
                  </div>

                  {/* assistant 메시지에만 버튼들 표시 */}
                  {message.type === 'assistant' && (
                    <div className="flex items-center gap mt-2">
                      <button
                        onClick={() => {
                          const previousMessage = index > 0 ? messages[index - 1] : null; // 이전 메시지(ux상으로 랜더링 중인 assistant 메시지의 바로 이전 메시지, 즉 user 메시지)
                          handleRollBackButtonClick(previousMessage?.id);
                        }}
                        disabled={isRollbackLoading}
                        className={`p-1 rounded-md transition-colors duration-200 ${isRollbackLoading
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        title={isRollbackLoading ? "Rolling back..." : "Rollback to before sending message"}
                      >
                        <Undo2 size={16} />
                      </button>
                      <button
                        onClick={() => handleRating(message.id, 'like')}
                        className={`p-1 rounded-md transition-colors duration-200 ${messageRatings[message.id] === 'like'
                            ? 'text-[#005de9] bg-gray-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        title="Like"
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button
                        onClick={() => handleRating(message.id, 'dislike')}
                        className={`p-1 rounded-md transition-colors duration-200 ${messageRatings[message.id] === 'dislike'
                            ? 'text-[#005de9] bg-gray-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        title="Dislike"
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  )}

                  {/* 메시지 타임스탬프 */}
                  {/* <div
                    className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </div> */}
                </div>
              </div>
            ))}

            {/* AI 응답 대기 중 TypingIndicator 표시 */}
            {isSendingMessage && (
              <div className="w-full">
                <div className="w-full rounded-lg px-2">
                  <TypingIndicator
                    variant="wave"
                    color="#005ed9"
                    dotCount={3}
                    sizePx={10}
                    showHelper={false}
                    className="py-3"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {!isAutoScrollEnabled && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => {
              setIsAutoScrollEnabled(true);
              forceScrollToBottom(true);
            }}
            className="bg-[#005de9] hover:bg-blue-600 text-white  w-8 h-8 rounded-full shadow-sm transition-transform duration-200 flex items-center justify-center group hover:scale-105"
            title="Go to latest message and enable auto-scroll"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AiChatViewer;
