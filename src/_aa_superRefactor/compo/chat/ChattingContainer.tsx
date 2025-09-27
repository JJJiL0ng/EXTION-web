"use client";

import React, { useState } from "react";
import ChatInputBox from "../../../_components/chat/ChatInputBox";
import ChatTabBar from "../../../_components/chat/ChatTabBar";
import AiChatViewer from "../../../_components/chat/AiChatViewer";
import { aiChatStore } from "@/_store/aiChat/aiChatStore";
export default function ChattingContainer() {

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
    <div
      className="bg-whiteh h-full flex flex-col bg-white w-full"
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
          <div>
            <ChatTabBar />
          </div>

          {/* 채팅 뷰어 */}
          <div className="flex-1 overflow-y-auto">
            <AiChatViewer />
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
