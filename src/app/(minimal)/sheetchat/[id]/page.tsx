//src/app/sheetchat/[id]/page.tsx
'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MainSpreadSheet from "@/components/MainSpreadSheet";
import ChattingMainContainer from "@/components/ChattingMainContainer";
import { useUnifiedStore } from '@/stores';
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
    setCurrentChatId,
    currentChatId
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

  // URL 파라미터에서 chatId를 읽어와서 채팅 로드 (ChatSidebar와 중복 방지)
  useEffect(() => {
    const loadChatFromUrl = async () => {
      if (!user) return;
      
      const chatId = searchParams.get('chatId');
      
      // ChatSidebar에서 이미 처리 중이거나 현재 채팅과 동일한 경우 건너뛰기
      if (!chatId || chatId === currentChatId) {
        return;
      }

      console.log('🔄 AI 페이지: URL 파라미터 채팅 ID 감지:', chatId);
      
      // ChatSidebar가 먼저 처리하도록 약간의 지연
      setTimeout(() => {
        // ChatSidebar에서 처리하지 못한 경우에만 fallback 로직 실행
        const currentChatIdAfterDelay = useUnifiedStore.getState().currentChatId;
        if (currentChatIdAfterDelay !== chatId) {
          console.log('⚠️ ChatSidebar에서 처리되지 않은 채팅 - fallback 로직 실행');
          setCurrentChatId(chatId);
        }
      }, 100);
    };

    loadChatFromUrl();
  }, [user, searchParams, currentChatId, setCurrentChatId]);

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