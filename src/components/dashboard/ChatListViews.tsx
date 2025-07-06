import React from 'react';
import Link from 'next/link';
import { Table, MoreVertical } from 'lucide-react';
import { ChatListItem } from '@/services/api/chatService';

interface ChatListViewsProps {
  chats: ChatListItem[];
  viewMode: 'grid' | 'list';
}

// const formatChatStatus = (chat: ChatListItem): string => {
//   if (chat.messageCount === 0) return '새 채팅';
//   if (chat.messageCount < 5) return '진행 중';
//   return '완료됨';
// };

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
    <div className="grid grid-cols-4 gap-6">
      {chats.map((chat) => (
        <Link key={chat.chatId} href={`/sheetchat/${chat.chatId}`}>
          <div className="border border-gray-200 rounded-lg bg-white hover:shadow-md cursor-pointer transition-all hover:border-[#005de9] hover:shadow-[#005de9]/10">
            <div className="p-6">
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-blue-50 to-[#005de9]/5 rounded border border-[#005de9]/20 flex items-center justify-center mb-4">
                <div className="w-full h-full rounded flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-[#005de9] rounded-lg flex items-center justify-center mb-3">
                    <Table className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-20 h-1.5 bg-[#005de9]/30 rounded mb-2"></div>
                  <div className="w-16 h-1.5 bg-[#005de9]/20 rounded mb-2"></div>
                  <div className="w-18 h-1.5 bg-[#005de9]/15 rounded"></div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#005de9] rounded flex items-center justify-center flex-shrink-0">
                  <Table className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 truncate">{chat.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(chat.lastUpdated)}</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export const ChatListList: React.FC<{ chats: ChatListItem[] }> = ({ chats }) => {
  return (
    <div>
      {chats.map((chat) => (
        <Link key={chat.chatId} href={`/sheetchat/${chat.chatId}`}>
          <div className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer transition-colors group border-b border-gray-200 last:border-b-0">
            <div className="w-8 h-8 bg-gradient-to-r from-[#005de9] to-[#005de9] rounded flex items-center justify-center flex-shrink-0 mr-3">
              <Table className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <p className="font-normal text-gray-900 truncate text-sm">{chat.title}</p>
              </div>
              <div className="flex items-center space-x-4 flex-shrink-0">
                <span className="text-xs text-gray-500 w-20 text-right">{formatDate(chat.lastUpdated)}</span>
                <button className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

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