// src/_components/chat/FileUploadChattingContainer.tsx
// 파일 업로드일때 채팅 컨테이너
import React, { useState, useEffect } from "react";
import ChatInputBox from "./ChatInputBox";
import ChatTabBar from "./ChatTabBar";
import AiChatViewer from "./AiChatViewer";
import { FileSelectModal } from "./SheetSelectModal";
import { ChatInitMode, UploadedFileInfo } from "../../_types/chat.types";
import { aiChatStore } from "@/_store/aiChat/aiChatStore";
import { useChattingComponentZindexStore } from "@/_store/handleZindex/chattingComponentZindexStore";

interface FileUploadChattingContainerProps {
  initMode?: ChatInitMode;
  fileInfo?: UploadedFileInfo;
  spreadSheetId?: string;
  userId?: string;
}

export default function FileUploadChattingContainer(_props: FileUploadChattingContainerProps) {

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // aiChatStore 사용
  const { wsError } = aiChatStore();

  // 채팅 z-index 상태 관리
  const { isVisible, zIndex } = useChattingComponentZindexStore();
  
  // 초기화 상태 관리 (간단한 구현)
  const [isInitialized] = useState(true);
  
  // 에러 클리어 함수
  const clearError = () => {
    // aiChatStore에서 에러를 클리어하는 로직이 필요하다면 여기서 구현
    console.log('Error cleared');
  };

  // 모달 열기/닫기 함수
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // 시트 선택 핸들러
  const handleSelectSheet = (sheetName: string) => {
    console.log('Selected sheet:', sheetName);
    // 시트 선택/해제는 모달 내부에서 처리되므로 여기서는 별도 로직 불필요
  };

  // 모달 외부 클릭 시 닫기
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
      className="bg-white border-gray-200 h-full flex flex-col transition-all duration-300"
      style={{
        zIndex: zIndex,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
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
          {/* 채팅 탭바 - 기존 채팅 모드에서만 표시 */}
          {/* {chatFlow.availableActions.canShowChatList && (
            <div>
              <ChatTabBar />
            </div>
          )} */}
          <div>
              <ChatTabBar />
          </div>
          
          {/* 채팅 뷰어 */}
          <div className="flex-1 overflow-y-auto">
            <AiChatViewer />
          </div>
          
          {/* 채팅 입력 박스와 모달을 포함하는 컨테이너 - 최하단 */}
          <div className="relative">
            {/* 파일 선택 모달 - ChatInputBox 바로 위에 위치 */}
            {isModalOpen && (
              <FileSelectModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSelectSheet={handleSelectSheet}
              />
            )}
            
            <ChatInputBox 
              // userId={userId}
              disabled={false} // 임시로 항상 활성화
              onFileAddClick={handleOpenModal}
            />
          </div>
        </>
      )}
    </div>
  );
}