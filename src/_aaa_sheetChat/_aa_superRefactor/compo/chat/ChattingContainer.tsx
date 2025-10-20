"use client";

import React, { useState, useEffect } from "react";
import ChatInputBox from "../../../_components/chat/ChatInputBox";
import ChatTabBar from "../../../_components/chat/ChatTabBar";
import AiChatViewer from "../../../_components/chat/AiChatViewer";
import { aiChatStore } from "@/_aaa_sheetChat/_store/aiChat/aiChatStore";
import { FileSelectModal } from "../../../_components/chat/SheetSelectModal";
import { useChatVisibilityState } from "@/_aaa_sheetChat/_aa_superRefactor/store/chat/chatVisibilityStore";

export default function ChattingContainer() {

  // aiChatStore 사용ㅁㄴㅇㄹ
  const { wsError } = aiChatStore();

  // 초기화 상태 관리 (간단한 구현)
  const [isInitialized] = useState(true);

  const { chatVisability, setChatVisability } = useChatVisibilityState();

  // 에러 클리어 함수
  const clearError = () => {
    // aiChatStore에서 에러를 클리어하는 로직이 필요하다면 여기서 구현
    console.log('Error cleared');
  };
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSelectSheet = (sheetName: string) => {
    console.log('Selected sheet:', sheetName);
    // 시트 선택/해제는 모달 내부에서 처리되므로 여기서는 별도 로직 불필요
  };

  // chatVisability에 따른 z-index와 visibility 스타일 결정
  const chatContainerStyle = {
    zIndex: chatVisability ? 50 : -1,
    visibility: chatVisability ? 'visible' : 'hidden',
    opacity: chatVisability ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out'
  } as React.CSSProperties;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen) {
        // 모달 외부 클릭 시 닫기 (모달 자체 내부 클릭은 제외)
        const target = event.target as Element;
        if (!target.closest('.sheet-select-modal')) {
          setIsModalOpen(false);
        }
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModalOpen]);
  return (
    <div
      className="bg-whiteh h-full flex flex-col bg-white w-full"
      style={chatContainerStyle}
    >
      {/* 초기화되지 않은 경우 로딩 표시 */}
      {!isInitialized ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">채팅을 초기화하고 있습니다...</div>
        </div>
      ) : wsError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="text-red-600 mb-4">초기화 중 오류가 발생했습니다</div>
            <div className="text-gray-600 mb-4 text-sm">{wsError}</div>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-[#005de9] text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* <div>
            <ChatTabBar />
          </div> */}

          {/* 채팅 뷰어 */}
          <div className="flex-1 overflow-y-auto">
            <AiChatViewer />
          </div>
          <div className="relative">
            {/* 파일 선택 모달 - ChatInputBox 바로 위에 위치 */}
            {isModalOpen && (
              <FileSelectModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSelectSheet={handleSelectSheet}
              />
            )}
          </div>

          {/* 채팅 입력 박스 - 최하단 */}
          <div className="relative overflow-visible">
            <ChatInputBox
              // userId={userId}
              disabled={false} // 임시로 항상 활성화
            />
          </div>
        </>
      )}
    </div>
  );
}   