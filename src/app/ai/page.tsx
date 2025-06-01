//src/app/ai/page.tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import MainSpreadSheet from "@/components/MainSpreadSheet";
import ChattingMainContainer from "@/components/ChattingMainContainer";

export default function Home() {
  const [leftWidth, setLeftWidth] = useState(65); // 초기 65%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);

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
      className="flex w-full h-screen overflow-hidden relative"
    >
      {/* 왼쪽 영역: MainSpreadSheet - 스크롤바 중복 방지를 위해 overflow 제거 */}
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
          w-2 h-full cursor-col-resize flex items-center justify-center relative
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
      
      {/* 오른쪽 영역: ChattingMainContainer - 스크롤바 중복 방지를 위해 overflow 제거 */}
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