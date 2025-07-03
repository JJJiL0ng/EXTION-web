"use client";

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getChatList, ChatListItem } from '@/services/api/chatService';
import DashboardSidebar from './DashboardSidebar';
import QuickActionGrid from './QuickActionGrid';
import CTASection from './CTASection';
import RecentChatsSection from './RecentChatsSection';
import MainLoadingSpinner from './MainLoadingSpinner';
import { ChatBoxOnly } from '../chatbox';
import FastActionButtons from './Fastaction';

const DashboardClient: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentChats, setRecentChats] = useState<ChatListItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      
      if (currentUser) {
        await loadUserChats(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserChats = async (userId: string) => {
    try {
      setChatsLoading(true);
      setApiError(null);
      
      if (!process.env.NEXT_PUBLIC_API_URL) {
        setApiError('API 서버 주소가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
        console.warn('NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.');
        return;
      }

      const response = await getChatList(userId);
      if (response.success) {
        setRecentChats(response.chats.slice(0, 6));
      }
    } catch (error) {
      console.error('채팅 목록 로드 실패:', error);
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          setApiError('API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        } else {
          setApiError(`채팅 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        setApiError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setChatsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (user) {
      loadUserChats(user.uid);
    }
  };

  if (isLoading) {
    return <MainLoadingSpinner />;
  }

  const handleSend = (message: string) => {
    console.log('메시지 전송:', message);
  };

  const handleUpload = () => {
    console.log('파일 업로드');
  };

  const handleSearch = () => {
    console.log('웹 검색');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar user={user} />
      
      <div className="flex-1">
        <div className="p-6">
          <ChatBoxOnly
            onSend={handleSend}
            onUpload={handleUpload}
            onSearch={handleSearch}
          />
          <div className="border-b border-gray-200 my-4"></div>
          <FastActionButtons />
          <div className="border-b border-gray-200 my-4"></div>
          <QuickActionGrid />
          {/* <div className="border-b border-gray-200 my-4"></div>
          {!user && (
            <>
              <CTASection />
              <div className="border-b border-gray-200 my-4"></div>
            </>
          )} */}

          <RecentChatsSection
            user={user}
            recentChats={recentChats}
            chatsLoading={chatsLoading}
            apiError={apiError}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardClient; 