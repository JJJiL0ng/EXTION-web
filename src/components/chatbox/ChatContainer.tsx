'use client'
import React, { useState } from 'react';
import DashboardBackButton from '@/components/shared/DashboardBackButton';
import ChatHeader from './ChatHeader';
import ChatInputArea from './ChatInputArea';
import { auth } from '@/services/firebase';

interface ChatContainerProps {
  showBackButton?: boolean;
  userName?: string;
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  placeholder?: string;
  onSend?: (message: string) => void;
  onUpload?: () => void;
  onSearch?: () => void;
  className?: string;
  headerClassName?: string;
  inputClassName?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  showBackButton = true,
  userName,
  title,
  subtitle,
  logoSrc,
  placeholder,
  onSend,
  onUpload,
  onSearch,
  className = "",
  headerClassName = "",
  inputClassName = ""
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    if (onSend) {
      onSend(inputValue);
    } else {
      console.log('메시지 전송:', inputValue);
    }
    
    setInputValue('');
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative ${className}`}>
      {/* 대시보드로 돌아가기 버튼 */}
      {showBackButton && <DashboardBackButton />}

      {/* 헤더 */}
      <ChatHeader
        userName={auth.currentUser?.displayName || ''}
        title={auth.currentUser?.displayName || ''}
        subtitle="님, 어떤 시트를 만들어볼까요?"
        logoSrc={logoSrc}
        className={headerClassName}
      />

      {/* 메인 입력 영역 */}
      <ChatInputArea
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onUpload={onUpload}
        onSearch={onSearch}
        placeholder={placeholder}
        className={inputClassName}
      />
    </div>
  );
};

export default ChatContainer; 