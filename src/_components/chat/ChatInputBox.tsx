'use client';

import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ChatMode } from '../../_hooks/aiChat/useChatMode';
import SelectedSheetNameCard from './SelectedSheetNameCard';
import FileAddButton from './FileAddButton';
import { getOrCreateGuestId } from '../../_utils/guestUtils';
import { useChatInputBoxHook } from '../../_hooks/aiChat/useChatInputBoxHook';

interface ChatInputBoxProps {
  onSendMessage?: (message: string, mode: ChatMode, selectedFile?: File) => void;
  placeholder?: string;
  disabled?: boolean;
  userId?: string;
  onFileAddClick?: () => void;
}

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  placeholder = "Enter your changes...",
  disabled = false,
  userId = getOrCreateGuestId(),
  onFileAddClick
}) => {
  const {
    // State
    message,
    setMessage,
    selectedFile,
    showModeModal,
    setShowModeModal,
    isFocused,
    mode,
    setMode,
    selectedSheets,
    removeSelectedSheet,
    isSendingMessage,
    isConnected,
    
    // Refs
    textareaRef,
    modeModalRef,
    
    // Handlers
    handleSend,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleFocus,
    handleBlur,
  } = useChatInputBoxHook({ userId });

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
            id="chat-input-message"
            name="chatMessage"
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full resize-none border-none outline-none text-gray-800 placeholder-gray-400 bg-transparent min-h-[24px] leading-6"
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
                      agent <span className="text-xs text-gray-500">Auto apply changes</span>
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
                      edit <span className="text-xs text-gray-500">Manual apply changes</span>
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
};

export default ChatInputBox;