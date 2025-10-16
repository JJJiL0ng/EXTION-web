"use client";

import React, { useState, useEffect } from "react"
import { useScChattingVisabliltyStore } from "@/_aaa_schema-converter/_sc-store/scChattingVisabiltyStore";
import ScChatInputbox from "./ScChatInputbox";
import ScChattingViewer from "./ScChattingViewer";

export default function ScChatting() {
  const { scChattingVisablilty, setScChattingVisablilty } = useScChattingVisabliltyStore();
  return (
    <div className="flex flex-col h-full w-96 bg-white border-l border-gray-200">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold">채팅 영역</h2>
        </div>
        
        {/* 채팅 뷰어 - flex-1로 남은 공간 차지 */}
        <div className="flex-1 overflow-hidden">
          <ScChattingViewer />
        </div>
        
        {/* 입력박스 - 하단 고정 */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <ScChatInputbox />
        </div>
    </div>
  );
}   