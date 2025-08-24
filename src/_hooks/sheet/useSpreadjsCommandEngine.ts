"use client";

import { useState, useCallback, useRef, RefObject } from 'react';

// 응답 데이터 타입 정의
interface FormulaResponse {
  success: boolean;
  analysis: {
    detectedOperation: string;
    dataRange: string;
    targetCells: string;
    operationType: string;
  };
  formulaDetails: {
    name: string;
    description: string;
    syntax: string;
    spreadjsCommand: string;
  };
  implementation: {
    steps: string[];
    cellLocations: {
      source: string;
      target: string;
      description: string;
    };
  };
}

// 실행 결과 타입
interface ExecutionResult {
  success: boolean;
  commandType: string;
  targetRange: string;
  error?: string;
  executedAt: string;
}

// Hook 상태 타입
interface SpreadjsCommandEngineState {
  isExecuting: boolean;
  error: string | null;
  lastResult: ExecutionResult | null;
  executionHistory: ExecutionResult[];
}

// Hook 옵션
interface UseSpreadjsCommandEngineOptions {
  onSuccess?: (result: ExecutionResult) => void;
  onError?: (error: Error) => void;
  enableHistory?: boolean;
  maxHistorySize?: number;
  requireConfirmation?: boolean;
}

export const useSpreadjsCommandEngine = (
  spreadRef: RefObject<any>,
  options: UseSpreadjsCommandEngineOptions = {}
) => {
  const {
    onSuccess,
    onError,
    enableHistory = true,
    maxHistorySize = 50,
    requireConfirmation = false
  } = options;

  const [state, setState] = useState<SpreadjsCommandEngineState>({
    isExecuting: false,
    error: null,
    lastResult: null,
    executionHistory: []
  });

  // 실행 중인 명령어 추적용
  const executingCommandRef = useRef<string | null>(null);

  // JavaScript 명령어 파싱 및 실행 - 주석 처리 (백엔드에서 일관된 명령어 형식으로 전송)
  // const executeJavaScriptCommand = useCallback((command: string, worksheet: any, spread: any) => {
  //   try {
  //     console.log('🔧 JavaScript 명령어 파싱 시작...');
  //     console.log('📝 원본 명령어:', command);
      
  //     // "javascript/" 접두사 완전 제거
  //     const cleanedCommand = command.replace(/^\s*javascript\s*\/?\s*/i, '').trim();
  //     console.log('✂️ 정리된 명령어:', cleanedCommand);
      
  //     // SpreadJS 글로벌 객체를 위한 컨텍스트 설정
  //     const GC = (window as any).GC;
  //     console.log('🔍 GC 객체 상태:', GC ? 'Available' : 'Undefined');
      
  //     // GC.Spread.Sheets.SheetArea.viewport 참조를 제거하고 기본값 사용
  //     let processedCommand = cleanedCommand;
  //     if (cleanedCommand.includes('GC.Spread.Sheets.SheetArea.viewport')) {
  //       console.log('⚠️ GC.Spread.Sheets.SheetArea.viewport 참조 발견 - 제거 중...');
  //       // setValue 호출에서 SheetArea.viewport 매개변수 제거
  //       processedCommand = processedCommand.replace(
  //         /worksheet\.setValue\(([^,]+),\s*([^,]+),\s*([^,]+),\s*GC\.Spread\.Sheets\.SheetArea\.viewport\s*\)/g,
  //         'worksheet.setValue($1, $2, $3)'
  //       );
  //       console.log('✂️ 처리된 명령어:', processedCommand);
  //     }
      
  //     // 안전한 실행을 위한 함수 생성
  //     const executeInContext = new Function(
  //       'worksheet', 
  //       'spread', 
  //       'GC',
  //       processedCommand
  //     );
      
  //     console.log('⚡ JavaScript 명령어 실행 시작...');
  //     // 명령어 실행
  //     executeInContext(worksheet, spread, GC);
      
  //     console.log('✅ JavaScript 명령어 실행 완료');
  //   } catch (error) {
  //     console.error('❌ JavaScript 명령어 실행 실패:', error);
  //     throw new Error(`JavaScript 명령어 실행 실패: ${error instanceof Error ? error.message : String(error)}`);
  //   }
  // }, []);
  // JavaScript 명령어 실행 (모든 명령어는 이제 JS 형식으로 통일)
  const executeJavaScriptCommand = useCallback((command: string, worksheet: any, spread: any) => {
    try {
      console.log('🔧 JavaScript 명령어 실행 시작...');
      console.log('📝 명령어:', command);
      
      // 명령어 끝에 세미콜론이 없으면 추가
      let processedCommand = command;
      if (!processedCommand.endsWith(';')) {
        processedCommand += ';';
      }
      
      console.log('🔧 최종 처리된 명령어:', processedCommand);
      
      // SpreadJS 글로벌 객체를 위한 컨텍스트 설정
      const GC = (window as any).GC;
      console.log('🔍 GC 객체 상태:', GC ? 'Available' : 'Undefined');
      
      // 안전한 실행을 위한 함수 생성 - 엄격 모드 사용
      const executeInContext = new Function(
        'worksheet', 
        'spread', 
        'GC',
        `"use strict"; ${processedCommand}`
      );
      
      console.log('⚡ JavaScript 명령어 실행 시작...');
      // 명령어 실행
      executeInContext(worksheet, spread, GC);
      
      console.log('✅ JavaScript 명령어 실행 완료');
    } catch (error) {
      console.error('❌ JavaScript 명령어 실행 실패:', error);
      console.error('❌ 실행 시도한 명령어:', command);
      throw new Error(`JavaScript 명령어 실행 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // 명령어 타입 식별 - 모든 명령어는 이제 JavaScript 형식으로 통일
  const identifyCommandType = useCallback((command: string): string => {
    return 'javascript';
  }, []);

  // 셀 범위 추출 (A1 형식에서 행/열 인덱스로 변환)
  const parseCellRange = useCallback((range: string) => {
    try {
      // A1:B10 형식 파싱
      const rangeMatch = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      if (rangeMatch) {
        const [, startCol, startRow, endCol, endRow] = rangeMatch;
        return {
          startRow: parseInt(startRow) - 1,
          startCol: startCol.charCodeAt(0) - 65,
          endRow: parseInt(endRow) - 1,
          endCol: endCol.charCodeAt(0) - 65
        };
      }

      // A1 형식 파싱
      const cellMatch = range.match(/([A-Z]+)(\d+)/);
      if (cellMatch) {
        const [, col, row] = cellMatch;
        const rowIndex = parseInt(row) - 1;
        const colIndex = col.charCodeAt(0) - 65;
        return {
          startRow: rowIndex,
          startCol: colIndex,
          endRow: rowIndex,
          endCol: colIndex
        };
      }

      return null;
    } catch (error) {
      console.warn('셀 범위 파싱 실패:', error);
      return null;
    }
  }, []);

  // 명령어 안전성 검사
  const validateCommand = useCallback((command: string, response: FormulaResponse): boolean => {
    try {
      // SpreadJS 인스턴스 확인
      if (!spreadRef.current) {
        throw new Error('SpreadJS 인스턴스가 없습니다.');
      }

      const sheet = spreadRef.current.getActiveSheet();
      if (!sheet) {
        throw new Error('활성 시트가 없습니다.');
      }

      // 대상 범위 검증
      const targetRange = parseCellRange(response.implementation.cellLocations.target);
      if (targetRange) {
        const maxRow = sheet.getRowCount();
        const maxCol = sheet.getColumnCount();

        if (targetRange.startRow >= maxRow || targetRange.startCol >= maxCol ||
            targetRange.endRow >= maxRow || targetRange.endCol >= maxCol) {
          throw new Error('대상 범위가 시트 범위를 벗어납니다.');
        }
      }

      // 위험한 명령어 체크
      const dangerousPatterns = [
        'clearAll',
        'deleteSheet',
        'removeSheet',
        'destroy'
      ];

      if (dangerousPatterns.some(pattern => command.includes(pattern))) {
        throw new Error('위험한 명령어가 감지되었습니다.');
      }

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error)
      }));
      return false;
    }
  }, [spreadRef, parseCellRange]);

  // 명령어 실행
  const executeCommand = useCallback((command: string, response: FormulaResponse): Promise<ExecutionResult> => {
    return new Promise((resolve, reject) => {
      try {
        const worksheet = spreadRef.current?.getActiveSheet();
        if (!worksheet) {
          throw new Error('활성 시트가 없습니다.');
        }

        const commandType = 'javascript'; // 모든 명령어는 JavaScript 형식으로 통일

        // 페인팅 일시 중단 (성능 최적화)
        worksheet.suspendPaint();

        try {
          // 모든 명령어는 JavaScript 형식으로 통일되어 실행
          console.log('🚀 JavaScript 명령어 실행 중...');
          executeJavaScriptCommand(command, worksheet, spreadRef.current);

          // 실행 결과 생성
          const executionResult: ExecutionResult = {
            success: true,
            commandType,
            targetRange: response.implementation.cellLocations.target,
            executedAt: new Date().toISOString()
          };

          resolve(executionResult);

        } catch (execError) {
          const executionResult: ExecutionResult = {
            success: false,
            commandType,
            targetRange: response.implementation.cellLocations.target,
            error: execError instanceof Error ? execError.message : String(execError),
            executedAt: new Date().toISOString()
          };

          reject(executionResult);
        } finally {
          // 페인팅 재개
          worksheet.resumePaint();
        }


      } catch (error) {
        const executionResult: ExecutionResult = {
          success: false,
          commandType: 'unknown',
          targetRange: '',
          error: error instanceof Error ? error.message : String(error),
          executedAt: new Date().toISOString()
        };

        reject(executionResult);
      }
    });
  }, [spreadRef, executeJavaScriptCommand]);

  // 히스토리 업데이트
  const updateHistory = useCallback((result: ExecutionResult) => {
    if (!enableHistory) return;

    setState(prev => {
      const newHistory = [result, ...prev.executionHistory];
      return {
        ...prev,
        executionHistory: newHistory.slice(0, maxHistorySize)
      };
    });
  }, [enableHistory, maxHistorySize]);

  // 메인 실행 함수
  const executeFormulaResponse = useCallback(async (response: FormulaResponse): Promise<void> => {
    if (!response.success || !response.formulaDetails?.spreadjsCommand) {
      throw new Error('유효하지 않은 응답 데이터입니다.');
    }

    const command = response.formulaDetails.spreadjsCommand;

    // 이미 실행 중인 경우 중단
    if (state.isExecuting) {
      throw new Error('이미 명령어가 실행 중입니다.');
    }

    // 사용자 확인이 필요한 경우
    if (requireConfirmation) {
      const confirmed = window.confirm(
        `다음 작업을 실행하시겠습니까?\n\n${response.analysis.detectedOperation}\n대상: ${response.implementation.cellLocations.target}`
      );
      if (!confirmed) {
        throw new Error('사용자가 실행을 취소했습니다.');
      }
    }

    setState(prev => ({
      ...prev,
      isExecuting: true,
      error: null
    }));

    executingCommandRef.current = command;

    try {
      // 명령어 검증
      if (!validateCommand(command, response)) {
        throw new Error('명령어 검증에 실패했습니다.');
      }

      // 명령어 실행
      const result = await executeCommand(command, response);

      // 상태 업데이트
      setState(prev => ({
        ...prev,
        isExecuting: false,
        lastResult: result,
        error: null
      }));

      // 히스토리 업데이트
      updateHistory(result);

      // 성공 콜백 호출
      onSuccess?.(result);

      console.log('✅ SpreadJS 명령어 실행 성공:', result);

    } catch (error) {
      const errorResult = error as ExecutionResult;

      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorResult.error || '알 수 없는 오류가 발생했습니다.',
        lastResult: errorResult
      }));

      // 실패한 경우에도 히스토리에 기록
      updateHistory(errorResult);

      // 에러 콜백 호출
      onError?.(new Error(errorResult.error || '명령어 실행 실패'));

      console.error('❌ SpreadJS 명령어 실행 실패:', errorResult);

      throw error;
    } finally {
      executingCommandRef.current = null;
    }
  }, [state.isExecuting, requireConfirmation, validateCommand, executeCommand, updateHistory, onSuccess, onError]);

  // JavaScript 명령어 직접 실행 함수
  const executeJavaScript = useCallback(async (jsCommand: string): Promise<void> => {
    if (!spreadRef.current) {
      throw new Error('SpreadJS 인스턴스가 없습니다.');
    }

    const worksheet = spreadRef.current.getActiveSheet();
    if (!worksheet) {
      throw new Error('활성 시트가 없습니다.');
    }

    // 이미 실행 중인 경우 중단
    if (state.isExecuting) {
      throw new Error('이미 명령어가 실행 중입니다.');
    }

    setState(prev => ({
      ...prev,
      isExecuting: true,
      error: null
    }));

    executingCommandRef.current = jsCommand;

    try {
      // JavaScript 명령어 실행
      executeJavaScriptCommand(jsCommand, worksheet, spreadRef.current);

      // 실행 결과 생성
      const result: ExecutionResult = {
        success: true,
        commandType: 'javascript',
        targetRange: 'N/A',
        executedAt: new Date().toISOString()
      };

      // 상태 업데이트
      setState(prev => ({
        ...prev,
        isExecuting: false,
        lastResult: result,
        error: null
      }));

      // 히스토리 업데이트
      updateHistory(result);

      // 성공 콜백 호출
      onSuccess?.(result);

      console.log('✅ JavaScript 명령어 실행 성공');

    } catch (error) {
      const errorResult: ExecutionResult = {
        success: false,
        commandType: 'javascript',
        targetRange: 'N/A',
        error: error instanceof Error ? error.message : String(error),
        executedAt: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorResult.error || '알 수 없는 오류가 발생했습니다.',
        lastResult: errorResult
      }));

      // 실패한 경우에도 히스토리에 기록
      updateHistory(errorResult);

      // 에러 콜백 호출
      onError?.(new Error(errorResult.error || 'JavaScript 명령어 실행 실패'));

      console.error('❌ JavaScript 명령어 실행 실패:', errorResult);

      throw error;
    } finally {
      executingCommandRef.current = null;
    }
  }, [state.isExecuting, spreadRef, executeJavaScriptCommand, updateHistory, onSuccess, onError]);

  // 실행 취소
  const cancelExecution = useCallback(() => {
    if (executingCommandRef.current) {
      executingCommandRef.current = null;
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: '사용자에 의해 취소되었습니다.'
      }));
    }
  }, []);

  // 상태 리셋
  const resetState = useCallback(() => {
    setState({
      isExecuting: false,
      error: null,
      lastResult: null,
      executionHistory: []
    });
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  return {
    // 상태
    isExecuting: state.isExecuting,
    error: state.error,
    lastResult: state.lastResult,
    executionHistory: state.executionHistory,

    // 메서드
    executeFormulaResponse,
    executeJavaScript,
    cancelExecution,
    resetState,
    clearError,

    // 유틸리티
    parseCellRange,
    identifyCommandType
  };
};

export type { FormulaResponse, ExecutionResult, SpreadjsCommandEngineState, UseSpreadjsCommandEngineOptions };
