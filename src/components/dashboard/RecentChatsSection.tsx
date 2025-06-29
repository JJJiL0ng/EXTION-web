"use client";

import React from 'react';
import { Filter, Grid3X3, List } from 'lucide-react';
import { User } from 'firebase/auth';
import { ChatListItem } from '@/services/api/chatService';
import ChatListViews from './ChatListViews';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import { GuestEmptyState, NoChatsEmptyState } from './EmptyStates';

interface RecentChatsSectionProps {
  user: User | null;
  recentChats: ChatListItem[];
  chatsLoading: boolean;
  apiError: string | null;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onRefresh?: () => void;
}

const RecentChatsSection: React.FC<RecentChatsSectionProps> = ({
  user,
  recentChats,
  chatsLoading,
  apiError,
  viewMode,
  setViewMode,
  onRefresh
}) => {
  const renderContent = () => {
    if (!user) {
      return <GuestEmptyState />;
    }

    if (apiError) {
      return <ErrorDisplay error={apiError} onRetry={onRefresh} />;
    }

    if (chatsLoading) {
      return <LoadingSpinner message="채팅 목록을 불러오는 중..." />;
    }

    if (recentChats.length === 0) {
      return <NoChatsEmptyState />;
    }

    return <ChatListViews chats={recentChats} viewMode={viewMode} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? '최근 시트채팅' : '시트채팅 미리보기'}
          </h2>
          <div className="flex items-center space-x-2">
            {user && !apiError && onRefresh && (
              <button 
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={onRefresh}
                disabled={chatsLoading}
              >
                {chatsLoading ? '로딩 중...' : '새로고침'}
              </button>
            )}
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-1 ml-4">
              <button 
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-[#005de9]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-[#005de9]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className={user ? "p-14 min-h-[900px]" : "p-6"}>
        {renderContent()}
      </div>
    </div>
  );
};

export default RecentChatsSection; 