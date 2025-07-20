"use client";


import MainChattingContainer from "@/_components/chat/MainChattingContainer";
import dynamic from "next/dynamic";
import React, { useState, useRef, useCallback } from "react";

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
    <div ref={containerRef} className="flex h-screen">
      <div 
        className="h-screen overflow-hidden"
        style={{ width: `${leftWidth}%` }}
      >
        <MainSpreadSheet />
      </div>
      
      {/* 드래그 가능한 구분선 */}
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
      
      <div 
        className="h-screen overflow-hidden"
        style={{ width: `${100 - leftWidth}%` }}
      >
          <MainChattingContainer />
      </div>
    </div>
  );
}

