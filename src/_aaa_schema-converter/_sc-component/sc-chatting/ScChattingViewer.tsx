//ai채팅과 유저 채팅 즉 메시지들을 랜더링하는 컴포넌트

import React from "react";
import { useScChattingStore } from "@/_aaa_schema-converter/_sc-store/scChattingStore";
import { useMappingScript } from "@/_aaa_schema-converter/_sc-hook/useMappingScript";

export default function ScChattingViewer() {
  const messages = useScChattingStore((state) => state.messages);
  const setHasPendingMappingSuggestion = useScChattingStore((state) => state.setHasPendingMappingSuggestion);
  const respondedMappingSuggestionId = useScChattingStore((state) => state.respondedMappingSuggestionId);
  const setRespondedMappingSuggestionId = useScChattingStore((state) => state.setRespondedMappingSuggestionId);
  const { createMappingScript } = useMappingScript();

  // 가장 마지막 mapping-suggestion 메시지 찾기
  const lastMappingSuggestion = messages
    .filter((msg) => msg.contentType === 'mapping-suggestion')
    .pop();

  // 수락 핸들러
  const handleAccept = (messageId: string) => {
    createMappingScript();
    console.log('Mapping suggestion accepted');
    setRespondedMappingSuggestionId(messageId);
    setHasPendingMappingSuggestion(false);
  };

  // 거절 핸들러
  const handleReject = (messageId: string) => {
    setRespondedMappingSuggestionId(messageId);
    setHasPendingMappingSuggestion(false);
  };

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
            <div key={message.id}>
              <div
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

              {/* 가장 마지막 mapping-suggestion에만 수락/거절 버튼 표시 */}
              {message.contentType === 'mapping-suggestion' &&
               lastMappingSuggestion?.id === message.id &&
               respondedMappingSuggestionId !== message.id && (
                <div className="flex gap-2 mt-2 justify-start">
                  <button
                    onClick={() => handleAccept(message.id)}
                    className="px-4 py-2 bg-[#005de9] text-white rounded-lg hover:bg-[#004bb7] active:scale-95 transition-all"
                  >
                    수락
                  </button>
                  <button
                    onClick={() => handleReject(message.id)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 active:scale-95 transition-all"
                  >
                    거절
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
