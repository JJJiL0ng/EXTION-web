import React, { useState } from "react";
import StreamingMarkdown from "./StreamingMarkdown";
import { AssistantMessage } from "../../../_types/chat.types";
import { useSpreadsheetContextSafe } from '@/_contexts/SpreadsheetContext';
import { transformStructuredContentToFormulaResponse, isValidFormulaContent, validateFormulaResponse } from '@/_utils/formulaTransformer';

interface FormulaMessageProps {
  message: AssistantMessage;
  className?: string;
}



export default function FormulaMessage({ message, className = "" }: FormulaMessageProps) {
  const [isApplied, setIsApplied] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  
  // SpreadsheetContext 사용 (안전한 버전)
  const spreadsheetContext = useSpreadsheetContextSafe();


  // 메시지가 존재하지 않거나 구조화된 응답이 없으면 null 반환
  if (!message?.structuredContent || message.structuredContent.intent !== "excel_formula") {
    return null;
  }

  // 버튼 표시 조건 확인
  const shouldShowButton = !isApplied && message.status === 'completed' && !isDenied && !executionError;
  console.log('🔍 FormulaMessage Context 상태:', {
    hasSpreadsheetContext: !!spreadsheetContext,
    isReady: spreadsheetContext?.isReady,
    shouldShowButton,
    messageStatus: message.status
  });

  const handleApplyFormula = async () => {
    // Context 및 데이터 검증
    if (!spreadsheetContext) {
      console.warn('SpreadsheetContext를 사용할 수 없습니다. MainSpreadSheet에서 열어주세요.');
      setExecutionError('스프레드시트가 준비되지 않았습니다.');
      return;
    }
    
    if (!spreadsheetContext.isReady) {
      setExecutionError('스프레드시트가 아직 초기화 중입니다.');
      return;
    }
    
    if (!isValidFormulaContent(message.structuredContent)) {
      setExecutionError('유효하지 않은 수식 데이터입니다.');
      return;
    }
    
    setIsExecuting(true);
    setExecutionError(null);
    
    try {
      // structuredContent를 FormulaResponse로 변환
      const formulaResponse = transformStructuredContentToFormulaResponse(
        message.structuredContent
      );
      
      // FormulaResponse 검증
      if (!validateFormulaResponse(formulaResponse)) {
        throw new Error('변환된 수식 데이터가 유효하지 않습니다.');
      }
      
      console.log('🔄 수식 실행 시작:', formulaResponse);
      
      // Context를 통해 수식 실행
      await spreadsheetContext.executeFormula(formulaResponse);
      
      // 성공 처리
      setIsApplied(true);
      console.log('✅ 수식이 성공적으로 적용되었습니다.');
      
    } catch (error) {
      console.error('❌ 수식 적용 실패:', error);
      setExecutionError(
        error instanceof Error ? error.message : '수식 적용 중 알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setIsExecuting(false);
    }
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
      
      {/* 수식 적용 여부 확인 UI */}
      {!isApplied && message.status === 'completed' && !isDenied && !executionError && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-gray-800 font-medium">
                수식 적용
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRejectFormula}
                disabled={isExecuting}
                className="px-2 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                아니오
              </button>
              <button
                onClick={handleApplyFormula}
                disabled={isExecuting || !spreadsheetContext?.isReady}
                className={`px-2 py-1 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors ${
                  !spreadsheetContext?.isReady 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'text-white bg-[#005ed9] hover:bg-blue-700'
                }`}
                title={!spreadsheetContext?.isReady ? '스프레드시트 초기화 중...' : '수식 적용'}
              >
                {isExecuting && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                )}
                {isExecuting ? '실행 중...' : 
                 !spreadsheetContext?.isReady ? '준비 중...' : '예'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실행 오류 메시지 */}
      {executionError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-red-800 font-medium">수식 적용 실패</span>
              <p className="text-red-700 text-sm mt-1">{executionError}</p>
            </div>
          </div>
          <button
            onClick={() => setExecutionError(null)}
            className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-800"
          >
            닫기
          </button>
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

