import React, { useState } from "react";
import ChatInputBox from "./ChatInputBox";
// import ChatViewer from "./ChatViewer";
import ChatTabBar from "./ChatTabBar";
import { ChatInitMode, UploadedFileInfo } from "../../_types/chat.types";
// import { useChatFlow, useChatStore } from "../../_hooks/chat/useChatStore";
// import { getOrCreateGuestId } from "../../_utils/guestUtils";
import { aiChatStore } from "@/_store/aiChat/aiChatStore";

interface MainChattingContainerProps {
  initMode?: ChatInitMode;
  fileInfo?: UploadedFileInfo;
  spreadSheetId?: string;
  userId?: string;
}

export default function MainChattingContainer(_props: MainChattingContainerProps) {
  
  // aiChatStore 사용
  const { wsError } = aiChatStore();
  
  // 초기화 상태 관리 (간단한 구현)
  const [isInitialized] = useState(true);
  
  // 에러 클리어 함수
  const clearError = () => {
    // aiChatStore에서 에러를 클리어하는 로직이 필요하다면 여기서 구현
    console.log('Error cleared');
  };

  return (
    <div className="bg-whiteh h-full flex flex-col">
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
            {/* <ChatViewer userId={userId} /> */}
            <div className="p-4 text-center text-gray-500">
              채팅 뷰어 컴포넌트 준비 중...
            </div>
          </div>
          
          {/* 채팅 입력 박스 - 최하단 */}
          <div>
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
