// src/_components/chat/FileUploadChattingContainer.tsx
// 파일 업로드일때 채팅 컨테이너
import React, { useState, useEffect } from "react";
import ChatInputBox from "./ChatInputBox";
import ChatViewer from "./ChatViewer";
import ChatTabBar from "./ChatTabBar";
import { FileSelectModal } from "./SheetSelectModal";
import { ChatInitMode, UploadedFileInfo } from "../../_types/chat.types";
import { useChatFlow, useChatStore } from "../../_hooks/chat/useChatStore";
import { getOrCreateGuestId } from "../../_utils/guestUtils";
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";

interface FileUploadChattingContainerProps {
  initMode?: ChatInitMode;
  fileInfo?: UploadedFileInfo;
  spreadSheetId?: string;
  userId?: string;
}

export default function FileUploadChattingContainer({
  initMode = ChatInitMode.FILE_UPLOAD,
  fileInfo,
  spreadSheetId,
  userId = getOrCreateGuestId() // Guest ID 사용
}: FileUploadChattingContainerProps) {

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // SpreadsheetContext에서 spreadRef 가져오기
  const { spreadRef } = useSpreadsheetContext();

  // v2 채팅 플로우 훅 사용
  const chatFlow = useChatFlow({
    mode: initMode,
    fileInfo,
    spreadSheetId
  });

  // v2 스토어에서 에러 상태 가져오기
  const { error: storeError, clearError } = useChatStore();

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
    <div className=" border-gray-200 h-full flex flex-col">
      {/* 초기화되지 않은 경우 로딩 표시 */}
      {!chatFlow.isInitialized ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">채팅을 초기화하고 있습니다...</div>
        </div>
      ) : storeError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="text-red-600 mb-4">초기화 중 오류가 발생했습니다</div>
            <div className="text-gray-600 mb-4 text-sm">{storeError.message}</div>
            <button 
              onClick={clearError}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
            <ChatViewer userId={userId} />
          </div>
          
          {/* 채팅 입력 박스와 모달을 포함하는 컨테이너 - 최하단 */}
          <div className="relative">
            {/* 파일 선택 모달 - ChatInputBox 바로 위에 위치 */}
            {isModalOpen && (
              <FileSelectModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSelectSheet={handleSelectSheet}
                spreadRef={spreadRef as React.RefObject<any>}
              />
            )}
            
            <ChatInputBox 
              userId={userId}
              disabled={!chatFlow.canSendMessage}
              spreadRef={spreadRef}
              onFileAddClick={handleOpenModal}
            />
          </div>
        </>
      )}
    </div>
  );
}