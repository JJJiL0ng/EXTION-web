import React from "react";
import ChatInputBox from "./ChatInputBox";
import ChatViewer from "./ChatViewer";
import ChatTabBar from "./ChatTabBar";
import { ChatInitMode, UploadedFileInfo } from "../../_types/chat.types";
import { useChatFlow, useChatStore } from "../../_hooks/chat/useChatStore";
import { getOrCreateGuestId } from "../../_utils/guestUtils";

interface MainChattingContainerProps {
  initMode?: ChatInitMode;
  fileInfo?: UploadedFileInfo;
  spreadSheetId?: string;
  userId?: string;
}

export default function MainChattingContainer({
  initMode = ChatInitMode.FILE_UPLOAD,
  fileInfo,
  spreadSheetId,
  userId = getOrCreateGuestId() // Guest ID 사용
}: MainChattingContainerProps) {
  
  // v2 채팅 플로우 훅 사용
  const chatFlow = useChatFlow({
    mode: initMode,
    fileInfo,
    spreadSheetId
  });

  // v2 스토어에서 에러 상태 가져오기
  const { error: storeError, clearError } = useChatStore();

  return (
    <div className="h-full flex flex-col">
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
          
          {/* 채팅 입력 박스 - 최하단 */}
          <div>
            <ChatInputBox 
              userId={userId}
              disabled={!chatFlow.canSendMessage}
            />
          </div>
        </>
      )}
    </div>
  );
}
