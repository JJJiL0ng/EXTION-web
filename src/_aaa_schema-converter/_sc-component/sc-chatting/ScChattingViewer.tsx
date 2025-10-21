//ai채팅과 유저 채팅 즉 메시지들을 랜더링하는 컴포넌트

import React from "react";
import ReactMarkdown from "react-markdown";
import { useScChattingStore } from "@/_aaa_schema-converter/_sc-store/scChattingStore";
import { useMappingScript } from "@/_aaa_schema-converter/_sc-hook/useMappingScript";

export default function ScChattingViewer() {
  const messages = useScChattingStore((state) => state.messages);
  const setHasPendingMappingSuggestion = useScChattingStore((state) => state.setHasPendingMappingSuggestion);
  const respondedMappingSuggestionId = useScChattingStore((state) => state.respondedMappingSuggestionId);
  const setRespondedMappingSuggestionId = useScChattingStore((state) => state.setRespondedMappingSuggestionId);
  const isCreatingScript = useScChattingStore((state) => state.isCreatingScript);
  const setIsCreatingScript = useScChattingStore((state) => state.setIsCreatingScript);
  const isAccepted = useScChattingStore((state) => state.isAccepted);
  const setIsAccepted = useScChattingStore((state) => state.setIsAccepted);
  const { createMappingScript } = useMappingScript();

  // 가장 마지막 mapping-suggestion 메시지 찾기
  const lastMappingSuggestion = messages
    .filter((msg) => msg.contentType === 'mapping-suggestion')
    .pop();

  // 수락 핸들러
  const handleAccept = async (messageId: string) => {
    try {
      setIsCreatingScript(true);
      setIsAccepted(true);
      setRespondedMappingSuggestionId(messageId);
      setHasPendingMappingSuggestion(false);
      
      await createMappingScript();
      console.log('Mapping suggestion accepted');
    } catch (error) {
      console.error('Failed to create mapping script:', error);
    } finally {
      setIsCreatingScript(false);
    }
  };

  // 거절 핸들러
  const handleReject = (messageId: string) => {
    setIsAccepted(false);
    setRespondedMappingSuggestionId(messageId);
    setHasPendingMappingSuggestion(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No messages yet
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
                  } rounded px-4 py-2 ${
                    message.role === "user"
                      ? "bg-[#005de9] text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="text-sm">
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-code:bg-gray-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-200 prose-pre:text-gray-900">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
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

              {/* 가장 마지막 mapping-suggestion에만 수락/거절 버튼 또는 상태 메시지 표시 */}
              {message.contentType === 'mapping-suggestion' &&
               lastMappingSuggestion?.id === message.id && (
                <div className="flex gap-2 mt-2 justify-start">
                  {respondedMappingSuggestionId === message.id ? (
                    // 수락한 경우에만 상태 메시지 표시
                    isAccepted && (
                      isCreatingScript ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#005de9] rounded-full animate-spin" />
                          <span className="text-sm">Creating script...</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 text-sm bg-gray-100 text-[#005de9] rounded">
                          ✓ Script has been applied
                        </div>
                      )
                    )
                  ) : (
                    // 수락/거절 버튼
                    <>
                      <button
                        onClick={() => handleAccept(message.id)}
                        className="px-4 py-2 bg-[#005de9] text-white rounded hover:bg-[#004bb7] active:scale-95 transition-all"
                        disabled={isCreatingScript}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(message.id)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 active:scale-95 transition-all"
                        disabled={isCreatingScript}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
