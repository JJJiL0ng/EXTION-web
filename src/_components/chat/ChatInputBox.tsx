'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, Check} from 'lucide-react';
import { useChatMode, ChatMode } from '../../_hooks/chat/useChatMode';
import SelectedSheetNameCard from './SelectedSheetNameCard';
import { useGetActiveSheetName } from '@/_hooks/sheet/common/useGetActiveSheetName'
import FileAddButton from './FileAddButton';
import { useSelectedSheetInfoStore } from '../../_hooks/sheet/common/useSelectedSheetInfoStore';
import { aiChatStore } from '@/_store/aiChat/aiChatStore';
import useSpreadsheetIdStore from '@/_store/sheet/spreadSheetIdStore'
import { getOrCreateGuestId } from '../../_utils/guestUtils'
import useSpreadsheetNamesStore from '@/_store/sheet/spreadSheetNamesStore'
import useChatIdStore from '@/_store/chat/chatIdStore'
import { useAiChatApiConnector } from '@/_hooks/aiChat/useAiChatApiConnector'; 

interface ChatInputBoxProps {
  // onSendMessage?: (message: string, mode: ChatMode, model: Model, selectedFile?: File) => void;
  onSendMessage?: (message: string, mode: ChatMode, selectedFile?: File) => void;
  placeholder?: string;
  disabled?: boolean;
  userId?: string;
  onFileAddClick?: () => void;
}

// type Model = 'Claude-sonnet-4' | 'OpenAi-GPT-4o' | 'Gemini-2.5-pro';

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  // onSendMessage,
  placeholder = "수정사항을 입력하세요...",
  disabled = false,
  userId = getOrCreateGuestId(), // Guest ID 사용
  onFileAddClick
}) => {
  console.log('🏗️ [ChatInputBox] Component mounting/rendering');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [model, setModel] = useState<Model>('Claude-sonnet-4');
  const [showModeModal, setShowModeModal] = useState(false);
  // const [showModelModal, setShowModelModal] = useState(false);
  const [isComposing, setIsComposing] = useState(false); // IME 입력 상태 추가
  const [isFocused, setIsFocused] = useState(false); // 포커스 상태 관리
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeModalRef = useRef<HTMLDivElement>(null);

  // useSpreadsheetContext 훅을 사용해서 spread 객체 가져오기
  // const spread = useSpreadsheetContext();

  // useChatMode 훅을 사용해서 mode 상태와 액션 가져오기
  const { mode, setMode } = useChatMode();

  // useSelectedSheetInfoStore 훅 사용
  const { selectedSheets, removeSelectedSheet, addSelectedSheet, renameSelectedSheet } = useSelectedSheetInfoStore();

  // aiChatStore 훅 사용
  const { addUserMessage, isSendingMessage, setIsSendingMessage } = aiChatStore();

  // AI Chat API Connector 훅 사용
  const { isConnected, isConnecting, connect, executeAiJob } = useAiChatApiConnector();

  // AI Chat API 서버 연결
  React.useEffect(() => {
    const connectToAiChatServer = async () => {
      console.log('🔄 [ChatInputBox] Connection effect triggered:', { 
        isConnected, 
        isConnecting,
        shouldConnect: !isConnected && !isConnecting 
      });
      
      if (!isConnected && !isConnecting) {
        try {
          console.log('🔌 [ChatInputBox] Attempting to connect to AI Chat server');
          const serverUrl = process.env.NEXT_PUBLIC_AI_CHAT_SERVER_URL || 'ws://localhost:8080';
          console.log('🔌 [ChatInputBox] Using server URL:', serverUrl);
          
          await connect(serverUrl);
          console.log('✅ [ChatInputBox] Successfully connected to AI Chat server');
        } catch (error) {
          console.error('❌ [ChatInputBox] Failed to connect to AI Chat server:', error);
        }
      } else if (isConnected) {
        console.log('✅ [ChatInputBox] Already connected to AI Chat server');
      } else if (isConnecting) {
        console.log('⏳ [ChatInputBox] Connection in progress...');
      }
    };

    connectToAiChatServer();
  }, [isConnected, isConnecting, connect]);

  // 연결 상태 변화 로깅
  React.useEffect(() => {
    console.log('🔗 [ChatInputBox] Connection status changed:', {
      isConnected,
      isConnecting,
      timestamp: new Date().toISOString()
    });
  }, [isConnected, isConnecting]);

  // 컴포넌트 언마운트 로깅
  React.useEffect(() => {
    return () => {
      console.log('🏗️ [ChatInputBox] Component unmounting');
    };
  }, []);

  const handleSend = async () => {
    if (message.trim() || selectedFile) {
      // 전송 상태 시작
      setIsSendingMessage(true);
      
      const messageToSend = message;
      // const fileToSend = selectedFile;
      const selectedSheetsToSend = selectedSheets; // 선택된 시트 정보 포함

      // 메시지 전송 전에 입력창 초기화
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // textarea 포커스 해제 후 다시 포커스를 주어 IME 상태를 초기화
      if (textareaRef.current) {
        textareaRef.current.blur();
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }

      try {
        // 선택된 시트 정보와 함께 메시지 전송
        console.log('🚀 [ChatInputBox] Sending message with selected sheets:', selectedSheetsToSend);
        console.log('🚀 [ChatInputBox] Message content:', messageToSend);
        console.log('🚀 [ChatInputBox] Chat mode:', mode);
        console.log('🚀 [ChatInputBox] About to call addUserMessage');
        
        const messageId = addUserMessage(messageToSend);
        
        console.log('✅ [ChatInputBox] User message added to store:', {
          messageId,
          content: messageToSend,
          timestamp: Date.now()
        });
        
        // Store 상태 확인
        console.log('📊 [ChatInputBox] Current store state:', aiChatStore.getState());

        // AI Chat API 호출
        if (isConnected) {
          console.log('🤖 [ChatInputBox] Starting AI job execution');
          console.log('🔗 [ChatInputBox] Connection status:', { isConnected, isConnecting });
          
          const aiRequest = {
            spreadsheetId: useSpreadsheetIdStore.getState().spreadsheetId!, // TODO: 실제 스프레드시트 ID 사용
            chatId: useChatIdStore.getState().chatId!, // TODO: 실제 채팅 ID 사용
            userId: userId, // TODO: 실제 사용자 ID 사용
            chatMode: mode,
            userQuestionMessage: messageToSend,
            parsedSheetNames: useSpreadsheetNamesStore.getState().selectedSheets.map((s) => s.name),
            jobId: '', // executeAiJob에서 자동 생성됨
          };

          console.log('📤 [ChatInputBox] AI request payload:', aiRequest);

          try {
            const result = await executeAiJob(aiRequest);
            console.log('🎉 [ChatInputBox] AI job completed successfully:', result);
            
            // TODO: AI 응답을 채팅 스토어에 추가
            // addAiMessage(result.result?.dataEditChatRes);
            
          } catch (aiError) {
            console.error('❌ [ChatInputBox] AI job failed:', aiError);
            // TODO: 에러 메시지를 사용자에게 표시
          }
        } else {
          console.warn('⚠️ [ChatInputBox] Not connected to AI server, skipping AI job');
        }
        
      } catch (error) {
        console.error('❌ [ChatInputBox] Message sending failed:', error);
      } finally {
        // 전송 상태 해제
        console.log('🏁 [ChatInputBox] Finishing message send process');
        setIsSendingMessage(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault();
      // disabled 상태일 때는 전송하지 않음
      if (!disabled && !isSendingMessage && (message.trim() || selectedFile)) {
        handleSend();
      }
    }
  };

  // IME 입력 시작 시 호출
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  // IME 입력 종료 시 호출
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 포커스 이벤트 핸들러
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 최대 높이 제한
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // 모달 외부 클릭 시 닫기 (수정된 버전)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 모드 모달 외부 클릭 확인
      if (showModeModal && modeModalRef.current && !modeModalRef.current.contains(target)) {
        setShowModeModal(false);
      }

      // 모델 모달 외부 클릭 확인
      // if (showModelModal && modelModalRef.current && !modelModalRef.current.contains(target)) {
      //   setShowModelModal(false);
      // }
    };

    if (showModeModal) { // || showModelModal
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModeModal]); // , showModelModal

  const { activeSheetName } = useGetActiveSheetName();
  // 최초 1회만 activeSheetName을 기본 선택으로 추가
  const didInitDefaultSelection = React.useRef(false);
  React.useEffect(() => {
    if (didInitDefaultSelection.current) return;
    if (!activeSheetName) return;
    if (selectedSheets.length > 0) {
      didInitDefaultSelection.current = true;
      return;
    }
    addSelectedSheet(activeSheetName);
    didInitDefaultSelection.current = true;
  }, [activeSheetName, selectedSheets.length, addSelectedSheet]);

  // 활성 시트명이 변경될 때, 선택된 칩이 하나인 경우 실시간으로 이름 동기화
  React.useEffect(() => {
    if (!activeSheetName) return;
    if (selectedSheets.length !== 1) return; // 여러 개 선택된 경우엔 사용자 선택을 존중
    const currentName = selectedSheets[0]?.name;
    if (currentName && currentName !== activeSheetName) {
      renameSelectedSheet(currentName, activeSheetName);
    }
  }, [activeSheetName, selectedSheets, renameSelectedSheet]);

  return (
    <div className="p-2 mx-auto justify-center w-full max-full">
      <div className={`bg-white border-2 ${isFocused ? 'border-[#005DE9]' : 'border-gray-200'} rounded-xl overflow-hidden transition-colors`}>
        {/* 상단 영역 - 파일 선택 + 선택된 시트들 */}
        <div className="p-3 flex items-center justify-between relative">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 파일 선택 버튼을 가장 왼쪽에 배치 */}
            <FileAddButton 
              onClick={onFileAddClick} 
              isSelected={selectedSheets.length > 0}
            />

            {/* 선택된 시트들 표시 */}
            {selectedSheets.map((sheet) => (
              <SelectedSheetNameCard 
                key={sheet.name}
                fileName={sheet.name}
                onRemove={() => removeSelectedSheet(sheet.name)}
                mode='chatInputBox'
              />
            ))}
          </div>
        </div>
        <div className="border-t border-gray-200" />
        {/* 메인 입력 영역 */}
        <div className="px-3 py-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full resize-none border-none outline-none text-gray-800 placeholder-gray-400 bg-transparent min-h-[12px] leading-6"
            disabled={false} // 항상 타이핑 가능하게 변경
            rows={1}
          />
        </div>

        {/* 하단 영역 - 컨트롤들 */}
        <div className="px-3 py-1 flex items-center justify-between relative">
          <div className="flex items-center">
            {/* 모드 선택 */}
            <div className="py-2 relative" ref={modeModalRef}>
              <button
                onClick={() => setShowModeModal(!showModeModal)}
                className="flex items-center justify-center gap-1 rounded-lg px-2 text-sm text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors w-20"
                disabled={disabled}
              // style={{ minHeight: '40px' }} // 버튼 높이 제한 해제
              >
                <span className="capitalize">{mode}</span>
                <span className="flex items-center" style={{ height: '24px' }}>
                  <ChevronDown size={16} /> {/* 크기 크게 조정 */}
                </span>
              </button>

              {/* 모드 선택 모달 */}
              {showModeModal && (
                <div className="absolute bottom-full mb-1 left-0 bg-white border border-[#D9D9D9] rounded-lg shadow-lg z-50 w-56">
                  {/* agent 옵션 */}
                  <button
                    onClick={() => {
                      setMode('agent');
                      setShowModeModal(false);
                    }}
                    className="w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-t-lg text-gray-700"
                    >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-left ">
                      agent <span className="text-xs text-gray-500">변경사항 자동 적용</span>
                      </span>
                      {/* 체크 아이콘 영역 (고정 폭으로 우측 정렬 고정) */}
                      <span className="w-5 h-5 flex items-center justify-center text-[#005DE9]">
                      {mode === 'agent' ? <Check size={16} /> : null}
                      </span>
                    </div>
                    </button>
                    {/* edit 옵션 */}
                    <button
                    onClick={() => {
                      setMode('edit');
                      setShowModeModal(false);
                    }}
                    className="w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-b-lg text-gray-700"
                    >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-left">
                      edit <span className="text-xs text-gray-500">변경사항 수동 적용</span>
                      </span>
                      <span className="w-5 h-5 flex items-center justify-center text-[#005DE9]">
                      {mode === 'edit' ? <Check size={16} /> : null}
                      </span>
                    </div>
                    </button>
                </div>
              )}
            </div>

            {/* 모델 선택 */}
            {/* <div className="relative" ref={modelModalRef}>
              <button
                onClick={() => setShowModelModal(!showModelModal)}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors w-40"
                disabled={disabled}
              >
                <span className="capitalize">{model}</span>
                <ChevronDown size={16} />
              </button>
              
              {/* 모델 선택 모달 */}
            {/* {showModelModal && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 ">
                  <button
                    onClick={() => {
                      setModel('Claude-sonnet-4');
                      setShowModelModal(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      model === 'Claude-sonnet-4' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    Claude-sonnet-4
                  </button>
                  <button
                    onClick={() => {
                      setModel('OpenAi-GPT-4o');
                      setShowModelModal(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      model === 'OpenAi-GPT-4o' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    OpenAi-GPT-4o
                  </button>
                  <button
                    onClick={() => {
                      setModel('Gemini-2.5-pro');
                      setShowModelModal(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      model === 'Gemini-2.5-pro' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    Gemini-2.5-pro
                  </button>
                </div>
              )}
            </div> */}
          </div>

          {/* 전송 버튼 */}
          <button
            onClick={handleSend}
            disabled={disabled || isSendingMessage || (!message.trim() && !selectedFile)}
            className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${disabled || isSendingMessage || (!message.trim() && !selectedFile)
              ? 'bg-gray-300 text-white cursor-not-allowed'
              : isConnected 
                ? 'bg-[#005DE9] text-white hover:bg-blue-700 active:scale-95'
                : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
              }`}
            title={!isConnected ? 'AI 서버 연결 중...' : '메시지 전송'}
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
};

export default ChatInputBox;