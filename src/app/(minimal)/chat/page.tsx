'use client'
import React from 'react';
import { ChatContainer } from '@/components/chatbox';

const ChatPage = () => {
  const handleSend = (message: string) => {
    console.log('메시지 전송:', message);
    // 여기에 실제 메시지 전송 로직을 추가할 수 있습니다
  };

  const handleUpload = () => {
    console.log('파일 업로드');
    // 파일 업로드 로직
  };

  const handleSearch = () => {
    console.log('웹 검색');
    // 웹 검색 로직
  };

  return (
    <ChatContainer
      onSend={handleSend}
      onUpload={handleUpload}
      onSearch={handleSearch}
    />
  );
};

export default ChatPage;