"use client";


import MainChattingContainer from "@/_components/chat/MainChattingContainer";
import FileUploadContainer from "@/_components/chat/FileUploadChattingContainer";
import dynamic from "next/dynamic";
import React, { useState, useRef, useCallback } from "react";
import { ChatVisibilityProvider, useChatVisibility } from "@/_contexts/ChatVisibilityContext";


const MainSpreadSheet = dynamic(
  () => {
    return import("../../../../../_components/sheet/MainSpreadSheet");
  },
  { ssr: false }
);

export default function Home() {
  const [leftWidth, setLeftWidth] = useState(75); // 초기값 70%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // 최소/최대 너비 제한 (20% ~ 80%)
    const clampedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
    setLeftWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 마우스 이벤트 리스너 등록
  React.useEffect(() => {
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
    <ChatVisibilityProvider initialVisible={false}>
      <HomeContent 
        leftWidth={leftWidth}
        setLeftWidth={setLeftWidth}
        isDragging={isDragging}
        containerRef={containerRef}
        handleMouseDown={handleMouseDown}
      />
    </ChatVisibilityProvider>
  );
}

interface HomeContentProps {
  leftWidth: number;
  setLeftWidth: (width: number) => void;
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
}

function HomeContent({ 
  leftWidth, 
  setLeftWidth,
  isDragging, 
  containerRef, 
  handleMouseDown 
}: HomeContentProps) {
  const { isChatVisible } = useChatVisibility();

  // 채팅이 숨겨질 때 스프레드시트 너비를 100%로 조정
  const actualLeftWidth = isChatVisible ? leftWidth : 100;

  return (
    <div ref={containerRef} className="flex h-screen">
      <div 
        className="h-screen overflow-hidden transition-all duration-300"
        style={{ width: `${actualLeftWidth}%` }}
      >
        <MainSpreadSheet />
      </div>
      
      {/* 채팅이 보일 때만 드래그 가능한 구분선 표시 - 깔끔한 닫힘 */}
      {isChatVisible && (
        <div
          className={`
            w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize 
            relative group transition-colors duration-200
            ${isDragging ? 'bg-blue-500' : ''}
          `}
          onMouseDown={handleMouseDown}
        >
          {/* 드래그 핸들 표시 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* 채팅 컨테이너 표시 - 깔끔한 닫힘 */}
      {isChatVisible && (
        <div 
          className="h-screen overflow-hidden transition-all duration-300"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <FileUploadContainer />
        </div>
      )}
    </div>
  );
}

