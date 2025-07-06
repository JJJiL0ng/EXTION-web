'use client'
import React from 'react';
import ChatHeader from './ChatHeader';
import ChatInputArea, { UploadedFile } from './ChatInputArea';
import { auth } from '@/services/firebase';

interface ChatBoxOnlyProps {
  onSend: (message: string, files: UploadedFile[]) => void;
  onUpload?: () => void;
  onSearch?: (isActive: boolean) => void;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

const ChatBoxOnly: React.FC<ChatBoxOnlyProps> = ({
  onSend,
  onUpload,
  onSearch,
  disabled = false,
  className = "",
  autoFocus = false,
}) => {
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
      <ChatInputArea
        onSend={onSend}
        onUpload={onUpload}
        onSearch={onSearch}
        disabled={disabled}
      />
    </div>
  );
};

export default ChatBoxOnly; 