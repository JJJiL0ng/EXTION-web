'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import MainSpreadSheet from "@/components/MainSpreadSheet";
import ChattingMainContainer from "@/components/ChattingMainContainer";

export default function Home() {
  const [leftWidth, setLeftWidth] = useState(50); // 초기 50%
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
    
    // 최소 10%, 최대 90%로 제한
    const clampedWidth = Math.min(Math.max(newLeftWidth, 10), 90);
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
      style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 왼쪽 영역: MainSpreadSheet */}
      <div style={{ 
        width: `${leftWidth}%`, 
        height: '100%',
        overflowY: 'auto',
        overflowX: 'auto',
        transition: isDragging ? 'none' : 'width 0.1s ease'
      }}>
        <MainSpreadSheet />
      </div>
      
      {/* 드래그 핸들 */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '8px',
          height: '100%',
          backgroundColor: isDragging ? '#005DE9' : '#e9ecef',
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: isDragging ? 'none' : 'background-color 0.2s ease',
          borderLeft: '1px solid #ddd',
          borderRight: '1px solid #ddd'
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!isDragging) {
            (e.target as HTMLDivElement).style.backgroundColor = '#005DE9';
          }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!isDragging) {
            (e.target as HTMLDivElement).style.backgroundColor = '#e9ecef';
          }
        }}
      >
        {/* 드래그 핸들 아이콘 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: '2px',
                backgroundColor: isDragging ? '#fff' : '#6c757d',
                borderRadius: '50%'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* 오른쪽 영역: CSVChatComponent */}
      <div style={{
        width: `${100 - leftWidth}%`,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'auto',
        transition: isDragging ? 'none' : 'width 0.1s ease'
      }}>
        <ChattingMainContainer />
      </div>
    </div>
  );
}