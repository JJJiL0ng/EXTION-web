'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, Settings, ChevronDown } from 'lucide-react';
import { useMainChat } from '../../_hooks/chat/useChatStore';
import { getOrCreateGuestId } from '../../_utils/guestUtils';

interface ChatInputBoxProps {
  onSendMessage?: (message: string, mode: string, model: string, selectedFile?: File) => void;
  placeholder?: string;
  disabled?: boolean;
  userId?: string;
}

type Mode = 'agent' | 'edit';
type Model = 'Claude-sonnet-4' | 'OpenAi-GPT-4o' | 'Gemini-2.5-pro';

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  // onSendMessage,
  placeholder = "메시지를 입력하세요...",
  disabled = false,
  userId = getOrCreateGuestId() // Guest ID 사용
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('agent');
  const [model, setModel] = useState<Model>('Claude-sonnet-4');
  const [showModeModal, setShowModeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeModalRef = useRef<HTMLDivElement>(null);
  const modelModalRef = useRef<HTMLDivElement>(null);

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
      // 외부 핸들러가 있으면 사용, 없으면 v2 스토어 사용
      // if (onSendMessage) {
      //   onSendMessage(message, mode, model, selectedFile || undefined);
      // } else {
      //   // v2 스토어로 메시지 전송
      //   await sendChatMessage(message);
      // }
      await sendChatMessage(message);
      
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
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
      if (showModelModal && modelModalRef.current && !modelModalRef.current.contains(target)) {
        setShowModelModal(false);
      }
    };

    if (showModeModal || showModelModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModeModal, showModelModal]);

  return (
    <div className="p-2 mx-auto ">
      <div className="bg-white border border-[#005DE9] rounded-3xl overflow-hidden border-2">
        {/* 상단 영역 - 파일 선택 */}
        <div className="px-6 py-3 border-b border-gray-100">
          {selectedFile ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                <Paperclip size={14} />
                <span className="truncate max-w-xs">{selectedFile.name}</span>
                <button
                  onClick={handleRemoveFile}
                  className="text-blue-500 hover:text-blue-700 ml-1"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <div className="text-left">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors"
                disabled={disabled}
              >
                <Paperclip size={16} />
                <span>선택된 파일</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
              />
            </div>
          )}
        </div>

        {/* 메인 입력 영역 */}
        <div className="px-4 py-[8px]">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full resize-none border-none outline-none text-gray-800 placeholder-gray-400 bg-transparent min-h-[24px] leading-6"
            disabled={disabled}
            rows={1}
          />
        </div>
          
        {/* 하단 영역 - 컨트롤들 */}
        <div className="px-6 py-3 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            {/* 모드 선택 */}
            <div className="relative" ref={modeModalRef}>
              <button
                onClick={() => setShowModeModal(!showModeModal)}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors w-20"
                disabled={disabled}
              >
                <span className="capitalize">{mode}</span>
                <ChevronDown size={16} />
              </button>
            
              {/* 모드 선택 모달 */}
              {showModeModal && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px] w-max">
                  <button
                    onClick={() => {
                      setMode('agent');
                      setShowModeModal(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      mode === 'agent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    Agent: 변경사항 자동 적용
                  </button>
                  <button
                    onClick={() => {
                      setMode('edit');
                      setShowModeModal(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      mode === 'edit' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    Edit: 변경사항 수동 적용
                  </button>
                </div>
              )}
            </div>

            {/* 모델 선택 */}
            <div className="relative" ref={modelModalRef}>
              <button
                onClick={() => setShowModelModal(!showModelModal)}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors w-40"
                disabled={disabled}
              >
                <span className="capitalize">{model}</span>
                <ChevronDown size={16} />
              </button>
              
              {/* 모델 선택 모달 */}
              {showModelModal && (
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
            </div>
          </div>

          {/* 전송 버튼 */}
          <button
            onClick={handleSend}
            disabled={disabled || isLoading || (!message.trim() && !selectedFile)}
            className={`flex items-center justify-center w-10 h-6 rounded-full transition-all ${
              disabled || isLoading || (!message.trim() && !selectedFile)
                ? 'bg-gray-300 text-white cursor-not-allowed'
                : 'bg-[#005DE9] text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInputBox;