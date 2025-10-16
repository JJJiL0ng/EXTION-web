//ai채팅과 유저 채팅 즉 메시지들을 랜더링하는 컴포넌트

import React from "react";
import { useScChattingStore } from "@/_aaa_schema-converter/_sc-store/scChattingStore";

export default function ScChattingViewer() {
  const messages = useScChattingStore((state) => state.messages);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            메시지가 없습니다
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`${
                  message.role === "user" ? "max-w-[80%]" : "w-full"
                } rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-[#005de9] text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === "user"
                      ? "text-gray-200"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
