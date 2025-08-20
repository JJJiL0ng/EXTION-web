import React, { useState, useEffect, useCallback, useRef } from "react";
import StreamingMarkdown from "./StreamingMarkdown";
import { AssistantMessage } from "../../../_types/chat.types";
import { useSpreadsheetContextSafe } from '@/_contexts/SpreadsheetContext';
import { transformStructuredContentToFormulaResponse, isValidFormulaContent, validateFormulaResponse } from '@/_utils/formulaTransformer';
import useChatModeStore from "@/_store/chat/chatModeStore";
import { useChatStore } from "@/_store/chat/chatStore";

interface FormulaMessageProps {
  message: AssistantMessage;
  className?: string;
}



export default function FormulaMessage({ message, className = "" }: FormulaMessageProps) {
  const [isApplied, setIsApplied] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isRolledBack, setIsRolledBack] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  
  // 롤백 후 자동 적용 차단을 위한 ref
  const lastRollbackTime = useRef<number>(0);
  
  // SpreadsheetContext 사용 (안전한 버전)
  const spreadsheetContext = useSpreadsheetContextSafe();
  
  // ChatMode 상태 가져오기
  const { mode } = useChatModeStore();
  
  // 채팅 상태 - 새로운 메시지 전송 여부 확인
  const { isStreaming, isInputDisabled, messages } = useChatStore();
  
  // 이 메시지 이후에 새로운 메시지가 있는지 확인
  const [hasNewerMessages, setHasNewerMessages] = useState(false);

  // 수식 적용 함수 정의
  const handleApplyFormula = useCallback(async () => {
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
  }, [spreadsheetContext, message.structuredContent]);

  // 롤백 핸들러 (Hook 규칙을 위해 early return 이전에 정의)
  const handleCancelApply = useCallback(async () => {
    // 이미 롤백 중이면 무시
    if (isRollingBack) {
      console.log('이미 롤백이 진행 중입니다.');
      return;
    }

    if (!spreadsheetContext?.commandManager) {
      console.warn('CommandManager를 사용할 수 없습니다.');
      setExecutionError('CommandManager를 사용할 수 없습니다.');
      return;
    }

    if (!spreadsheetContext.commandManager.canRollback) {
      console.warn('롤백할 수 있는 이전 상태가 없습니다.');
      setExecutionError('롤백할 수 있는 이전 상태가 없습니다.');
      return;
    }

    console.log('🔄 롤백을 시작합니다...');
    setIsRollingBack(true);
    setExecutionError(null);

    try {
      console.log('📞 rollback 함수를 호출하기 전...');
      
      // 타임아웃을 설정하여 무한 대기 방지  
      const rollbackPromise = spreadsheetContext.commandManager.rollback({ type: 'single' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('롤백 타임아웃 (5초)')), 5000)
      );
      
      await Promise.race([rollbackPromise, timeoutPromise]);
      
      console.log('✅ 롤백 완료, 상태를 업데이트합니다...');
      
      // 상태 초기화 - 적용 전 상태로 되돌리기
      setIsApplied(false);
      setIsRolledBack(true);
      
      // 롤백 시간 기록 (5초간 자동 적용 차단)
      lastRollbackTime.current = Date.now();
      
      console.log('✅ 수식 적용이 성공적으로 취소되었습니다.');
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setIsRolledBack(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ 롤백 실패:', error);
      setExecutionError(
        error instanceof Error ? error.message : '롤백 중 알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      console.log('🔄 롤백 상태를 false로 설정합니다...');
      setIsRollingBack(false);
    }
  }, [spreadsheetContext, isRollingBack]);

  // 새로운 메시지 전송 확인 - 현재 메시지 이후에 새로운 메시지가 있으면 버튼 비활성화
  useEffect(() => {
    // 현재 메시지의 인덱스 찾기
    const currentMessageIndex = messages.findIndex(msg => msg.id === message.id);
    
    if (currentMessageIndex !== -1) {
      // 현재 메시지 이후에 새로운 메시지가 있는지 확인
      const hasNewerMessages = currentMessageIndex < messages.length - 1;
      setHasNewerMessages(hasNewerMessages);
      
      // if (hasNewerMessages) {
      //   console.log('🚫 새로운 메시지가 전송되어 이전 수식 버튼들을 비활성화합니다.');
      // }
    }
  }, [messages, message.id]);

  // agent 모드일 때 자동으로 수식 적용
  useEffect(() => {
    const autoApplyFormula = async () => {
      // 롤백 후 5초간 자동 적용 차단
      const timeSinceRollback = Date.now() - lastRollbackTime.current;
      const isRecentlyRolledBack = timeSinceRollback < 5000;
      
      // console.log('🔍 자동 적용 조건 체크:');
      // console.log('  mode:', mode);
      // console.log('  messageStatus:', message.status);
      // console.log('  isApplied:', isApplied);
      // console.log('  isDenied:', isDenied);
      // console.log('  executionError:', !!executionError);
      // console.log('  isExecuting:', isExecuting);
      // console.log('  isRollingBack:', isRollingBack);
      // console.log('  isRolledBack:', isRolledBack);
      // console.log('  timeSinceRollback:', timeSinceRollback);
      // console.log('  isRecentlyRolledBack:', isRecentlyRolledBack);
      // console.log('  hasNewerMessages:', hasNewerMessages);
      // console.log('  spreadsheetReady:', spreadsheetContext?.isReady);
      // console.log('  hasStructuredContent:', !!message?.structuredContent);
      // console.log('  intentMatch:', message?.structuredContent?.intent === "excel_formula");

      // agent 모드이고, 메시지가 완성되었으며, 아직 적용되지 않았고, 거부되지도 않았을 때
      // 단, 롤백 중이거나 롤백 직후 5초간은 자동 적용하지 않음
      // 그리고 새로운 메시지일 때만 자동 적용 가능
      if (
        mode === 'agent' && 
        message.status === 'completed' && 
        !isApplied && 
        !isDenied && 
        !executionError && 
        !isExecuting &&
        !isRollingBack &&     // 롤백 중일 때 자동 적용 방지
        !isRolledBack &&      // 롤백 직후에도 자동 적용 방지
        !isRecentlyRolledBack && // 롤백 후 5초간 자동 적용 방지
        !hasNewerMessages &&  // 새로운 메시지가 있으면 자동 적용 방지
        spreadsheetContext?.isReady &&
        message?.structuredContent &&
        message.structuredContent.intent === "excel_formula"
      ) {
        console.log('✅ 자동 적용 조건 만족, 수식 적용 실행');
        await handleApplyFormula();
      } else {
        // console.log('❌ 자동 적용 조건 불만족, 건너뜀');
      }
    };

    autoApplyFormula();
  }, [mode, message.status, isApplied, isDenied, executionError, isExecuting, isRollingBack, isRolledBack, spreadsheetContext?.isReady, message?.structuredContent, handleApplyFormula]);

  // 메시지가 존재하지 않거나 구조화된 응답이 없으면 null 반환
  if (!message?.structuredContent || message.structuredContent.intent !== "excel_formula") {
    return null;
  }

  // 버튼 표시 조건 확인 (edit 모드이고 새로운 메시지가 없을 때만)
  const shouldShowButton = mode === 'edit' && !isApplied && message.status === 'completed' && !isDenied && !executionError && !hasNewerMessages;

  const handleRejectFormula = () => {
    setIsDenied(true);
    console.log("수식 적용이 거부되었습니다");
  };

  const handleStayApply = () => {
    // 적용 유지 로직
  };

  // 수식 메시지 렌더링
  return (
    <div className="formula-message">
      <StreamingMarkdown
        content={message.content}
        isStreaming={message.status === 'streaming'}
        className={className}
      />
      
      {/* 수식 적용 여부 확인 UI (edit 모드일 때만 표시) */}
      {shouldShowButton && (
        <div className="mt-4 border-gray-200 rounded-lg shadow-sm">
          <div className="flex space-x-3">
            <button
              onClick={handleRejectFormula}
              disabled={isExecuting}
              className="flex-1 px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleApplyFormula}
              disabled={isExecuting || !spreadsheetContext?.isReady}
              className={`flex-1 px-6 py-2 text-sm font-medium border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors ${
              !spreadsheetContext?.isReady 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'text-white' // 기본 텍스트 색상
              }`}
              style={{
              backgroundColor: spreadsheetContext?.isReady ? '#005ed9' : undefined
              }}
              title={!spreadsheetContext?.isReady ? '스프레드시트 초기화 중...' : '수식 적용'}
            >
              {isExecuting && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
              )}
              {isExecuting ? '실행 중...' : 
               !spreadsheetContext?.isReady ? '준비 중...' : '적용'}
            </button>
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
        <div className="mt-1 p-2 bg-blue-200 border border-blue-700 rounded-lg" style={{ borderColor: '#005ed9' }}>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-[#005ed9] mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">수식이 스프레드시트에 적용되었습니다.</span>
          </div>
        </div>
      )}

      {/* 롤백 완료 메시지 */}
      {isRolledBack && (
        <div className="mt-1 p-2 bg-yellow-50 border border-yellow-400 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 font-medium">수식 적용이 취소되었습니다. 이전 상태로 되돌렸습니다.</span>
          </div>
        </div>
      )}

      {/* 적용 완료 후 액션 버튼들 - 새로운 메시지가 있으면 숨김 */}
      {isApplied && !hasNewerMessages && (
        <div className="mt-3 border-gray-200 rounded-lg shadow-sm">
          <div className="flex space-x-3">
            <button
              onClick={handleCancelApply}
              disabled={isRollingBack || !spreadsheetContext?.commandManager?.canRollback}
              className="flex-1 px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isRollingBack && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
              )}
              {isRollingBack ? '취소 중...' : '적용 취소'}
            </button>
            <button
              onClick={handleStayApply}
              disabled={isRollingBack}
              className="flex-1 px-6 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: '#005ed9'
              }}
            >
              적용 유지
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

