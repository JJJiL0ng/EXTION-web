"use client";

import FileUploadContainer from "@/_aaa_sheetChat/_components/chat/FileUploadChattingContainer";
import dynamic from "next/dynamic";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
// import { ChatVisibilityProvider, useChatVisibility } from "@/_contexts/ChatVisibilityContext";
import { SpreadsheetProvider } from "@/_aaa_sheetChat/_contexts/SpreadsheetContext";
import { useParams } from "next/navigation";
import useSpreadsheetIdStore from "@/_aaa_sheetChat/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_aaa_sheetChat/_store/chat/chatIdAndChatSessionIdStore";
import { useChattingComponentZindexStore } from "@/_aaa_sheetChat/_store/handleZindex/chattingComponentZindexStore";
import { enableMapSet } from 'immer';


// Immer MapSet 플러그인 활성화
enableMapSet();

const MainSpreadSheet = dynamic(
  () => {
    return import("../../../../../_aaa_sheetChat/_components/sheet/MainSpreadSheet");
  },
  { ssr: false }
);

export default function Home() {
  const params = useParams();
  const { setSpreadSheetId } = useSpreadsheetIdStore();
  const { setChatId } = useChatStore();

  const [leftWidth, setLeftWidth] = useState(75); // 초기값 70%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // spreadjs 컨텍스트 인스턴스를 담은 인스턴스 - 페이지 이동해도 유지되도록 useMemo 사용
  const spreadRef = useMemo(() => ({ current: null }), []);


  // URL 파라미터에서 spreadsheetId와 chatId를 추출하여 store에 저장
  useEffect(() => {
    console.log('🔍 [Page] URL Parameters:', { params });

    if (params?.SpreadSheetId && typeof params.SpreadSheetId === 'string') {
      console.log('📊 [Page] Setting spreadsheetId:', params.SpreadSheetId);
      setSpreadSheetId(params.SpreadSheetId);
    }

    if (params?.ChatId && typeof params.ChatId === 'string') {
      console.log('💬 [Page] Setting chatId:', params.ChatId);
      setChatId(params.ChatId);
    }

    // 저장된 값 확인
    setTimeout(() => {
      const { spreadSheetId } = useSpreadsheetIdStore.getState();
      const { chatId } = useChatStore.getState();
      console.log('✅ [Page] Stored values:', { spreadSheetId, chatId });
    }, 100);
  }, [params, setSpreadSheetId, setChatId]);

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
    // <ChatVisibilityProvider initialVisible={false}>
    <SpreadsheetProvider spreadRef={spreadRef}>
      <HomeContent
        leftWidth={leftWidth}
        setLeftWidth={setLeftWidth}
        isDragging={isDragging}
        containerRef={containerRef}
        handleMouseDown={handleMouseDown}
        spreadRef={spreadRef}
      />
    </SpreadsheetProvider>
    // </ChatVisibilityProvider>
  );
}

interface HomeContentProps {
  leftWidth: number;
  setLeftWidth: (width: number) => void;
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
  spreadRef: React.MutableRefObject<any>;
}

function HomeContent({
  leftWidth,
  setLeftWidth,
  isDragging,
  containerRef,
  handleMouseDown,
  spreadRef
}: HomeContentProps) {
  // const { isChatVisible } = useChatVisibility();
  const { isVisible } = useChattingComponentZindexStore();




  // 채팅이 숨겨질 때 스프레드시트 너비를 100%로 조정
  const actualLeftWidth = isVisible ? leftWidth : 100;

  return (
    <div ref={containerRef} className="flex h-screen">
      <div
        className="h-screen overflow-hidden transition-all duration-300"
        style={{ width: `${actualLeftWidth}%` }}
      >
        <MainSpreadSheet spreadRef={spreadRef} />
      </div>

      {/* 채팅이 보일 때만 드래그 가능한 구분선 표시 - 깔끔한 닫힘 */}
      {isVisible && (
        <div
          className={`
            w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize
            relative group transition-colors duration-200
            ${isDragging ? 'bg-[#005de9]' : ''}
          `}
          onMouseDown={handleMouseDown}
        >
          {/* 드래그 핸들 표시 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}

      {/* 채팅 컨테이너 표시 - z-index로 제어됨 */}
      <div
        className="h-screen overflow-hidden transition-all duration-300"
        style={{ width: `${100 - actualLeftWidth}%` }}
      >
        <FileUploadContainer />
      </div>
    </div>
  );
}