'use client'
import React, { useState, useRef, useEffect } from 'react';
import ChatInputControls from './ChatInputControls';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface ChatInputAreaProps {
  onSend: (message: string, files: UploadedFile[]) => void;
  onUpload?: () => void;
  onSearch?: (isActive: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
  minHeight?: number;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSend,
  onUpload,
  onSearch,
  placeholder = "어떤 시트를 만들어볼까요?\n가지고 계신 데이터들을 보내주세요! 표로 만들어드릴게요.",
  disabled = false,
  className = "",
  maxHeight = 200,
  minHeight = 80
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  const handleSendClick = () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;
    onSend(inputValue, uploadedFiles);
    setInputValue('');
    setUploadedFiles([]);
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleSearchClick = () => {
    const newSearchState = !isSearchActive;
    setIsSearchActive(newSearchState);
    if (onSearch) {
      onSearch(newSearchState);
    }
  };

  const handleTextareaFocus = () => {
    textareaRef.current?.focus();
  };

  return (
    <div className={`w-full max-w-4xl ${className}`}>
      {/* 입력창 */}
      <div 
        className="input-container bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 transition-all duration-200 relative" 
        style={{ borderColor: inputValue ? '#005ed9' : '#e5e7eb' }}
      >
        <style jsx>{`
          .input-container:focus-within {
            border-color: #005ed9 !important;
            box-shadow: 0 0 0 3px rgba(0, 94, 217, 0.1);
          }
        `}</style>
        
        {/* 커스텀 placeholder */}
        {!inputValue && uploadedFiles.length === 0 && (
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
          onChange={(e) => setInputValue(e.target.value)}
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
        <ChatInputControls
          inputValue={inputValue}
          onSend={handleSendClick}
          onUpload={onUpload}
          onSearch={handleSearchClick}
          disabled={disabled}
          uploadedFiles={uploadedFiles}
          onFilesChange={setUploadedFiles}
          isSearchActive={isSearchActive}
        />
      </div>
    </div>
  );
};

export default ChatInputArea; 