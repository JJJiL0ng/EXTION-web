'use client';

import { useAdminStore } from '@/stores/adminStore';
import { AdminMessage } from '@/stores/adminStore';
import { User, Bot, FileText, Calculator, BarChart, Database, Settings } from 'lucide-react';

export default function AdminChatRender() {
  const { chatData } = useAdminStore();

  if (!chatData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">채팅 데이터가 없습니다</h3>
          <p className="text-sm text-gray-400">채팅 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'USER':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'EXTION_AI':
        return <Bot className="w-5 h-5 text-green-600" />;
      case 'SYSTEM':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FORMULA':
        return <Calculator className="w-4 h-4 text-purple-500" />;
      case 'VISUALIZATION':
        return <BarChart className="w-4 h-4 text-orange-500" />;
      case 'DATA_GENERATION':
      case 'DATA_EDIT':
        return <Database className="w-4 h-4 text-cyan-500" />;
      case 'FILE_UPLOAD':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: Date | string | undefined) => {
    if (!timestamp) return '알 수 없음';
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const renderMessage = (message: AdminMessage) => {
    const isUser = message.role === 'USER';
    const isSystem = message.role === 'SYSTEM';

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
              <div className="flex items-center gap-1">
                {getRoleIcon(message.role)}
                <span className="text-sm font-medium text-gray-700">
                  {message.role === 'EXTION_AI' ? 'Extion AI' : message.role}
                </span>
              </div>
            )}
            {getTypeIcon(message.type) && (
              <div className="flex items-center gap-1">
                {getTypeIcon(message.type)}
                <span className="text-xs text-gray-500">{message.type}</span>
              </div>
            )}
            <span className="text-xs text-gray-400">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          
          <div className={`
            p-3 rounded-lg shadow-sm
            ${isUser 
              ? 'bg-blue-600 text-white' 
              : isSystem 
                ? 'bg-gray-100 text-gray-700 border border-gray-200' 
                : 'bg-white text-gray-800 border border-gray-200'
            }
          `}>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
            
            {/* 추가 정보 표시 */}
            {message.mode && message.mode !== 'NORMAL' && (
              <div className="mt-2 text-xs opacity-75">
                <span className="font-medium">모드: </span>
                {message.mode}
              </div>
            )}
            
            {message.fileUploadInfo && (
              <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                <div className="font-medium">파일 업로드:</div>
                <div>{message.fileUploadInfo.fileName || '파일 정보'}</div>
              </div>
            )}
            
            {message.formulaData && (
              <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                <div className="font-medium">수식 데이터:</div>
                <div className="font-mono">{JSON.stringify(message.formulaData, null, 2)}</div>
              </div>
            )}
            
            {message.artifactData && (
              <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                <div className="font-medium">아티팩트:</div>
                <div>{JSON.stringify(message.artifactData, null, 2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {chatData.title || '제목 없음'}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>채팅 ID: {chatData.id}</span>
              <span>사용자 ID: {chatData.userId}</span>
              <span>메시지 수: {chatData.messageCount}</span>
              <span>상태: {chatData.status}</span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>생성: {formatTimestamp(chatData.createdAt)}</div>
            <div>수정: {formatTimestamp(chatData.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {chatData.messages && chatData.messages.length > 0 ? (
          <div className="space-y-2">
            {chatData.messages.map((message) => renderMessage(message))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">메시지가 없습니다</h3>
              <p className="text-sm text-gray-400">이 채팅에는 메시지가 없습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
