import React, { useState } from "react";
import StreamingMarkdown from "./StreamingMarkdown";
import { AssistantMessage } from "../../../_types/chat.types";

// import { useSpreadJSCommand } from "@/_hooks/sheet/useSpreadjsCommand";

interface FormulaMessageProps {
  message: AssistantMessage;
  className?: string;
}



export default function FormulaMessage({ message, className = "" }: FormulaMessageProps) {
  const [isApplied, setIsApplied] = useState(false);
  const [isDenied, setIsDenied] = useState(false);


  // 메시지가 존재하지 않거나 구조화된 응답이 없으면 null 반환
  if (!message?.structuredContent || message.structuredContent.intent !== "excel_formula") {
    return null;
  }

  const handleApplyFormula = () => {
    // useSpreadJSCommand().applyFormula(message.content);
    setIsApplied(true);
    console.log("수식이 적용되었습니다:", message.content);
  };

  const handleRejectFormula = () => {
    setIsDenied(true);
    console.log("수식 적용이 거부되었습니다");
  };

  // 수식 메시지 렌더링
  return (
    <div className="formula-message">
      <StreamingMarkdown
        content={message.content}
        isStreaming={message.status === 'streaming'}
        className={className}
      />
      
      {/* 수식 적용 여부 확인 UI | 사용자가 no누르면 사라짐 */}
      {!isApplied && message.status === 'completed' && !isDenied && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-gray-800 font-medium">
                이 수식을 스프레드시트에 적용하시겠습니까?
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRejectFormula}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                아니오
              </button>
              <button
                onClick={handleApplyFormula}
                className="px-3 py-1 text-sm font-medium text-white bg-[#005ed9] border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 적용 완료 메시지 */}
      {isApplied && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">수식이 스프레드시트에 적용되었습니다.</span>
          </div>
        </div>
      )}
    </div>
  );
}

