import React from 'react';
import Link from 'next/link';
import { Table, MoreVertical } from 'lucide-react';
import { ChatListItem } from '@/services/api/chatService';

interface ChatListViewsProps {
  chats: ChatListItem[];
  viewMode: 'grid' | 'list';
}

const formatChatStatus = (chat: ChatListItem): string => {
  if (chat.messageCount === 0) return '새 채팅';
  if (chat.messageCount < 5) return '진행 중';
  return '완료됨';
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    });
  } catch {
    return '날짜 불명';
  }
};

export const ChatListGrid: React.FC<{ chats: ChatListItem[] }> = ({ chats }) => {
  return (
    <div className="grid grid-cols-8 gap-6">
      {chats.map((chat) => (
        <Link key={chat.chatId} href={`/sheetchat/${chat.chatId}`}>
          <div className="p-6 rounded-lg border-2 border-blue-200 bg-blue-50 hover:shadow-lg cursor-pointer transition-all hover:scale-105">
            <div className="w-full aspect-square bg-gradient-to-r from-[#005de9] to-[#005de9] rounded-lg flex items-center justify-center mb-4">
              <Table className="w-10 h-10 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate mb-3">{chat.title}</p>
            <div className="space-y-2">
              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {formatChatStatus(chat)}
              </span>
              <p className="text-xs text-gray-500">{formatDate(chat.lastUpdated)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export const ChatListList: React.FC<{ chats: ChatListItem[] }> = ({ chats }) => {
  return (
    <div className="space-y-4">
      {chats.map((chat) => (
        <Link key={chat.chatId} href={`/sheetchat/${chat.chatId}`}>
          <div className="flex items-center space-x-6 p-6 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
            <div className="w-16 h-16 bg-gradient-to-r from-[#005de9] to-[#005de9] rounded-lg flex items-center justify-center">
              <Table className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{chat.title}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {formatChatStatus(chat)}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">메시지 {chat.messageCount}개 • {formatDate(chat.lastUpdated)}</span>
              </div>
            </div>
            <button className="p-3 hover:bg-gray-200 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
};

const ChatListViews: React.FC<ChatListViewsProps> = ({ chats, viewMode }) => {
  return viewMode === 'list' ? 
    <ChatListList chats={chats} /> : 
    <ChatListGrid chats={chats} />;
};

export default ChatListViews; 