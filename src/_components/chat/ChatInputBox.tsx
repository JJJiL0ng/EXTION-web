'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, Settings, ChevronDown } from 'lucide-react';
import { useMainChat } from '../../_hooks/chat/useChatStore';
import { getOrCreateGuestId } from '../../_utils/guestUtils';
import { useChatMode , ChatMode} from '../../_hooks/sheet/useChatMode';
import FileUploadCard from './UploadedFileNameCard';

interface ChatInputBoxProps {
  // onSendMessage?: (message: string, mode: ChatMode, model: Model, selectedFile?: File) => void;
  onSendMessage?: (message: string, mode: ChatMode, selectedFile?: File) => void;
  placeholder?: string;
  disabled?: boolean;
  userId?: string;
}

// type Model = 'Claude-sonnet-4' | 'OpenAi-GPT-4o' | 'Gemini-2.5-pro';

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  // onSendMessage,
  placeholder = "수정사항을 입력하세요...",
  disabled = false,
  userId = getOrCreateGuestId() // Guest ID 사용
}) => {
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
  // const modelModalRef = useRef<HTMLDivElement>(null);

  // useChatMode 훅을 사용해서 mode 상태와 액션 가져오기
  const { mode, setMode } = useChatMode();

  // v2 채팅 훅 사용
  const { sendMessage: sendChatMessage, isLoading } = useMainChat(userId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (message.trim() || selectedFile) {
      const messageToSend = message;
      const fileToSend = selectedFile;

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

      await sendChatMessage(messageToSend);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault();
      // disabled 상태일 때는 전송하지 않음
      if (!disabled && !isLoading && (message.trim() || selectedFile)) {
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

  return (
    <div className="p-2 mx-auto justify-center w-full max-full">
      <div className={`bg-white border-2 ${isFocused ? 'border-[#005DE9]' : 'border-gray-200'} rounded-xl overflow-hidden transition-colors`}>
        {/* 상단 영역 - 파일 선택 */}
        <div className="p-3 flex items-center justify-between relative">
           <FileUploadCard />
        </div>
        <div className="border-t border-gray-200"/>
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
          <div className="absolute bottom-full mb-1 left-0 bg-white border border-[#D9D9D9] rounded-lg shadow-lg z-50 w-48">
            <button
              onClick={() => {
                setMode('agent');
                setShowModeModal(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-t-lg ${
                mode === 'agent' ? 'bg-gray-200 text-gray-700' : 'text-gray-700'
              }`}
            >
              agent: 변경사항 자동 적용
            </button>
            <button
              onClick={() => {
                setMode('edit');
                setShowModeModal(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-b-lg ${
                mode === 'edit' ? 'bg-gray-200 text-gray-700' : 'text-gray-700'
              }`}
            >
              edit: 변경사항 수동 적용
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
            disabled={disabled || isLoading || (!message.trim() && !selectedFile)}
            className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
              disabled || isLoading || (!message.trim() && !selectedFile)
                ? 'bg-gray-300 text-white cursor-not-allowed'
                : 'bg-[#005DE9] text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? (
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