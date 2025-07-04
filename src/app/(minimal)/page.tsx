//src/app/table-generate/page.tsx
'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MainSpreadSheet from "@/components/MainSpreadSheet";
import ChattingMainContainer from "@/components/ChattingMainContainer";
import { useUnifiedStore } from '@/stores';
import { useLoadChatandsheet } from '@/hooks/useLoadChatandsheet';
import { auth } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function AIPageContent() {
  const [leftWidth, setLeftWidth] = useState(65); // 초기 65%
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const searchParams = useSearchParams();
  
  // const { currentChatId } = useUnifiedStore();
  
  // Chat과 Sheet 데이터 로드를 위한 훅 사용
  const { 
    isLoading: isLoadingChatSheet, 
    error: chatSheetError, 
    hasSheetData,
    retryLoad,
    clearError
  } = useLoadChatandsheet();

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

  // useLoadChatandsheet 훅이 URL 파라미터를 자동으로 처리하므로 별도 로직 불필요
  // 사용자 인증이 완료된 후에만 데이터 로드가 가능하도록 체크

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
      {isLoadingChatSheet && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">채팅과 시트 데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {chatSheetError && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 max-w-md mx-auto p-6">
            <div className="text-red-500 text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h3 className="text-lg font-semibold mb-2">데이터 로드 실패</h3>
              <p className="text-sm text-gray-600 mb-4">{chatSheetError}</p>
              <div className="flex space-x-2">
                <button
                  onClick={retryLoad}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={clearError}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
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