'use client'
import React, { useState, useRef, useEffect } from 'react';
import ChatInputControls from './ChatInputControls';
import ChatHeader from './ChatHeader';
import { auth } from '@/services/firebase';

interface ChatBoxOnlyProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string) => void;
  onUpload?: () => void;
  onSearch?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
  minHeight?: number;
  showControls?: boolean;
  autoFocus?: boolean;
  uploadedFiles?: UploadedFile[];
  onFilesChange?: (files: UploadedFile[]) => void;
  isSearchActive?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const ChatBoxOnly: React.FC<ChatBoxOnlyProps> = ({
  value: controlledValue,
  onChange,
  onSend,
  onUpload,
  onSearch,
  placeholder = "어떤 시트를 만들어볼까요?\n가지고 계신 데이터들을 보내주세요! 표로 만들어드릴게요.",
  disabled = false,
  className = "",
  maxHeight = 200,
  minHeight = 80,
  showControls = true,
  autoFocus = false,
  uploadedFiles,
  onFilesChange,
  isSearchActive
}) => {
  const [internalValue, setInternalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // controlled vs uncontrolled 처리
  const isControlled = controlledValue !== undefined;
  const inputValue = isControlled ? controlledValue : internalValue;

  const handleInputChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  // 텍스트 에어리어 높이 자동 조절
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current as HTMLTextAreaElement;
    if (textarea) { 
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;
    
    onSend?.(inputValue);
    
    // 메시지 전송 후 입력값 초기화
    if (!isControlled) {
      setInternalValue('');
    }
  };

  const handleTextareaFocus = () => {
    textareaRef.current?.focus();
  };

  return (
    <div className={`w-[60%] mx-auto ${className}`}>
        <div className="mb-4"></div>
         <ChatHeader
        userName={auth.currentUser?.displayName || ''}
        title={auth.currentUser?.displayName ? `${auth.currentUser?.displayName}님,` : ''}
        subtitle={auth.currentUser ? "말 한마디로 시트를 생성해보세요" : "안녕하세요, 말로 편하게 시트를 생성해보세요"}
        logoSrc="/logo.png"
        className="mb-4"
      />

      <div 
        className="input-container bg-white rounded-2xl border-2 border-[#005ed9] shadow-sm transition-all duration-200 relative hover:shadow-lg hover:scale-[1.01]" 
      >
        <style jsx>{`
          .input-container:focus-within {
            border-color: #005ed9 !important;
            box-shadow: 0 0 0 3px rgba(0, 94, 217, 0.1);
            transform: scale(1.02);
          }
        `}</style>
        
        {/* 커스텀 placeholder */}
        {!inputValue && (
          <div 
            className="absolute top-6 left-6 right-6 text-gray-500 text-lg pointer-events-none select-none leading-relaxed"
            onClick={handleTextareaFocus}
          >
            {placeholder.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < placeholder.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full bg-transparent border-none outline-none resize-none px-6 py-6 text-gray-900 text-lg relative z-10"
          style={{ 
            height: 'auto',
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`
          }}
        />
        
        {/* 하단 컨트롤 */}
        {showControls && (
          <ChatInputControls
            inputValue={inputValue}
            onSend={handleSend}
            onUpload={onUpload}
            onSearch={onSearch}
            disabled={disabled}
            uploadedFiles={uploadedFiles || []}
            onFilesChange={onFilesChange || (() => {})}
            isSearchActive={isSearchActive || false}
          />
        )}
      </div>
    </div>
  );
};

export default ChatBoxOnly; 