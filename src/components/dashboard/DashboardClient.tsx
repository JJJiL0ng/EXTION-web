"use client";

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/firebase';
import { getChatList, ChatListItem } from '@/services/api/chatService';
import useTableGenerate from '@/hooks/useTablegenerate';
import { useAuthStore } from '@/stores/authStore';
import DashboardSidebar from './DashboardSidebar';
import QuickActionGrid from './QuickActionGrid';
import CTASection from './CTASection';
import RecentChatsSection from './RecentChatsSection';
import MainLoadingSpinner from './MainLoadingSpinner';
import { ChatBoxOnly } from '../chatbox';
import FastActionButtons from './Fastaction';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const DashboardClient: React.FC = () => {
  const { user: authUser, setUser: setAuthUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [recentChats, setRecentChats] = useState<ChatListItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // 상태를 DashboardClient로 이동
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const router = useRouter();
  const { generateTable } = useTableGenerate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthUser(currentUser);
      setIsLoading(false);
      
      if (currentUser) {
        await loadUserChats(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [setAuthUser]);

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
    if (authUser) {
      loadUserChats(authUser.uid);
    }
  };

  if (isLoading) {
    return <MainLoadingSpinner />;
  }

  const handleSend = (message: string) => {
    console.log('[DashboardClient] handleSend 호출됨, 메시지:', message);
    const userId = authUser?.uid;

    if (!message.trim() && uploadedFiles.length === 0) {
      alert('메시지를 입력하거나 파일을 업로드해주세요.');
      return;
    }
    
    if (!userId) {
      alert('테이블을 생성하려면 로그인이 필요합니다.');
      return;
    }
    
    const filesToUpload = uploadedFiles.map(f => f.file);

    generateTable({
      userId,
      message: message,
      files: filesToUpload,
      webSearchEnabled: isSearchActive,
    });
    
    router.push('/table-generate');
  };

  const handleUpload = () => {
    console.log('파일 업로드');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar user={authUser} />
      
      <div className="flex-1">
        <div className="my-20 p-6">
          <ChatBoxOnly
            onSend={handleSend}
            onUpload={handleUpload}
            onSearch={() => setIsSearchActive(!isSearchActive)}
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
            isSearchActive={isSearchActive}
          />
          <div className="my-4"></div>
          <FastActionButtons />
          <div className="my-20"></div>
          <div className="border-b border-gray-200 my-4 w-[60%] mx-auto"></div>
          <QuickActionGrid />
          {/* <div className="border-b border-gray-200 my-4"></div>
          {!user && (
            <>
              <CTASection />
              <div className="border-b border-gray-200 my-4"></div>
            </>
          )} */}

          <RecentChatsSection
            user={authUser}
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