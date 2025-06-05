//src/app/ai/page.tsx
'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MainSpreadSheet from "@/components/MainSpreadSheet";
import ChattingMainContainer from "@/components/ChattingMainContainer";
import { useUnifiedStore } from '@/stores';
import { getSpreadsheetData } from '@/services/firebase/spreadsheetService';
import { getUserChats, getChatMessages, convertFirebaseMessageToChatMessage } from '@/services/firebase/chatService';
import { auth } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function AIPageContent() {
  const [leftWidth, setLeftWidth] = useState(65); // 초기 65%
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const searchParams = useSearchParams();
  
  const {
    setXLSXData,
    setCurrentChatId,
    setCurrentSpreadsheetId,
    clearAllMessages,
    currentChatId,
    addMessageToSheet
  } = useUnifiedStore();

  // 로컬 스토리지에서 저장된 비율 불러오기
  useEffect(() => {
    const savedWidth = localStorage.getItem('layout-split');
    if (savedWidth) {
      const width = parseFloat(savedWidth);
      if (width >= 10 && width <= 90) {
        setLeftWidth(width);
      }
    }
  }, []);

  // 비율 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('layout-split', leftWidth.toString());
  }, [leftWidth]);

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // URL 파라미터에서 chatId를 읽어와서 채팅 로드
  useEffect(() => {
    const loadChatFromUrl = async () => {
      if (!user) return;
      
      const chatId = searchParams.get('chatId');
      if (!chatId || chatId === currentChatId) return;

      console.log('=== URL에서 채팅 로드 시작 ===', chatId);
      setIsLoading(true);

      try {
        // 1. 사용자의 채팅 목록에서 해당 채팅 찾기
        const userChats = await getUserChats(user.uid);
        const targetChat = userChats.find(chat => chat.id === chatId);
        
        if (!targetChat) {
          console.warn('해당 채팅을 찾을 수 없습니다:', chatId);
          return;
        }

        console.log('📋 채팅 발견:', {
          id: targetChat.id,
          title: targetChat.title,
          hasSpreadsheet: !!targetChat.spreadsheetId,
          spreadsheetId: targetChat.spreadsheetId,
          messageCount: targetChat.messageCount,
          status: targetChat.status
        });

        // 2. 기존 데이터 초기화 (다른 채팅으로 전환 시)
        console.log('🧹 새 채팅 전환 - 기존 데이터 초기화');
        setXLSXData(null);
        setCurrentSpreadsheetId(null);
        clearAllMessages();
        
        // 파일 업로드 상태도 초기화하여 새 파일 업로드 가능하게 함
        const store = useUnifiedStore.getState();
        store.resetAllStores(); // 완전한 초기화

        // 3. 채팅 ID 설정
        setCurrentChatId(chatId);

        console.log('새 채팅 로드 시작:', chatId);

        // 4. 스프레드시트 데이터 로드
        if (targetChat.spreadsheetId) {
          console.log('스프레드시트 로드 시작:', targetChat.spreadsheetId);
          
          try {
            const spreadsheetData = await getSpreadsheetData(targetChat.spreadsheetId);
            
            if (spreadsheetData) {
              console.log('✅ 스프레드시트 데이터 로드 성공:', {
                fileName: spreadsheetData.fileName,
                sheetsCount: spreadsheetData.sheets?.length,
                spreadsheetId: targetChat.spreadsheetId
              });
              
              // 스프레드시트 데이터 설정
              setXLSXData(spreadsheetData);
              setCurrentSpreadsheetId(targetChat.spreadsheetId);
              
              console.log('✅ 스프레드시트 메타데이터 설정 완료');
            } else {
              console.warn('⚠️ 스프레드시트 데이터를 찾을 수 없습니다:', targetChat.spreadsheetId);
              // 스프레드시트 로드 실패 시에만 메시지 지우기
            }
          } catch (spreadsheetError) {
            console.error('❌ 스프레드시트 로드 실패:', spreadsheetError);
            // 스프레드시트 로드 실패 시에만 메시지 지우기
          }
        } else {
          console.log('스프레드시트 ID가 없음 - 채팅만 로드');
          // 스프레드시트가 없는 경우는 메시지를 지우지 않음
        }

        // 5. 채팅 메시지 로드
        console.log('채팅 메시지 로드 시작:', chatId);
        try {
          
          const firebaseMessages = await getChatMessages(chatId);
          console.log('✅ Firebase 메시지 로드 성공:', firebaseMessages.length, '개');

          // Firebase 메시지를 ChatMessage로 변환하고 시트별로 분류
          if (firebaseMessages.length > 0) {
            firebaseMessages.forEach((firebaseMessage) => {
              const chatMessage = convertFirebaseMessageToChatMessage(firebaseMessage);
              const sheetIndex = firebaseMessage.sheetContext?.sheetIndex ?? 0;
              
              console.log('메시지 추가:', {
                messageId: chatMessage.id,
                sheetIndex,
                type: chatMessage.type,
                contentPreview: chatMessage.content.substring(0, 50) + '...'
              });
              
              addMessageToSheet(sheetIndex, chatMessage);
            });
            
            console.log('✅ 모든 메시지가 스토어에 저장되었습니다');
          } else {
            console.log('📭 채팅에 메시지가 없습니다');
          }
        } catch (messagesError) {
          console.error('❌ 채팅 메시지 로드 실패:', messagesError);
          // 메시지 로드 실패 시에만 메시지 지우기
          clearAllMessages();
        }

        console.log('=== URL에서 채팅 로드 완료 ===');
      } catch (error) {
        console.error('❌ URL 채팅 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatFromUrl();
  }, [user, searchParams, currentChatId, setCurrentChatId, setXLSXData, setCurrentSpreadsheetId, clearAllMessages, addMessageToSheet]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isMouseDownRef.current = true;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDownRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // 최소 20%, 최대 80%로 제한 (사이드바 고려)
    const clampedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
    setLeftWidth(clampedWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isMouseDownRef.current = false;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="flex w-full h-screen relative"
    >
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">채팅을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 왼쪽 영역: MainSpreadSheet - 독립적인 스크롤 영역 */}
      <div 
        className="h-full transition-all duration-100 ease-linear"
        style={{ 
          width: `${leftWidth}%`,
          transition: isDragging ? 'none' : 'width 0.1s ease'
        }}
      >
        <MainSpreadSheet />
      </div>
      
      {/* 드래그 핸들 - 개선된 스타일링 */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          w-2 h-full cursor-col-resize flex items-center justify-center relative z-50
          border-l border-r border-gray-300 transition-colors duration-200
          ${isDragging ? 'bg-blue-600' : 'bg-gray-200 hover:bg-blue-600'}
        `}
      >
        {/* 드래그 핸들 아이콘 - 더 명확한 시각적 피드백 */}
        <div className="flex flex-col items-center gap-0.5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`
                w-0.5 h-0.5 rounded-full transition-colors duration-200
                ${isDragging ? 'bg-white' : 'bg-gray-600'}
              `}
            />
          ))}
        </div>
      </div>
      
      {/* 오른쪽 영역: ChattingMainContainer - 독립적인 스크롤 영역 */}
      <div 
        className="h-full transition-all duration-100 ease-linear"
        style={{
          width: `${100 - leftWidth}%`,
          transition: isDragging ? 'none' : 'width 0.1s ease'
        }}
      >
        <ChattingMainContainer />
      </div>
    </div>
  );
}

// 로딩 폴백 컴포넌트
function AIPageLoading() {
  return (
    <div className="flex w-full h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 - Suspense로 감싸기
export default function Home() {
  return (
    <Suspense fallback={<AIPageLoading />}>
      <AIPageContent />
    </Suspense>
  );
}