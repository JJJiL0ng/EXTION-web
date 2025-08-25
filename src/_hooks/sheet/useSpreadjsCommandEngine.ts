"use client";

import { useState, useCallback, useRef, RefObject } from 'react';
import GC from '@mescius/spread-sheets';

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
      console.log('📝 원본 명령어:', command);
      
      // 명령어에서 'javascript/' 접두사 제거 (있다면)
      let processedCommand = command;
      if (processedCommand.startsWith('javascript/')) {
        processedCommand = processedCommand.replace('javascript/', '');
      }
      
      // 명령어 끝에 세미콜론이 없으면 추가
      if (!processedCommand.endsWith(';')) {
        processedCommand += ';';
      }
      
      console.log('🔧 최종 처리된 명령어:', processedCommand);
      
      // SpreadJS 글로벌 객체를 위한 컨텍스트 설정 (import된 GC 사용)
      console.log('🔍 GC 객체 상태:', GC ? 'Available' : 'Undefined');
      
      // 안전한 실행을 위한 함수 생성 - 엄격 모드 사용
      const executeInContext = new Function(
        'worksheet', 
        'spread', 
        'GC',
        `"use strict"; ${processedCommand}`
      );
      
      console.log('⚡ JavaScript 명령어 실행 시작...');
      // 명령어 실행 (import된 GC 객체 전달)
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
      console.log('🔤 셀 범위 파싱 시작:', range);

      // A1:B10 형식 파싱
      const rangeMatch = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      if (rangeMatch) {
        const [, startCol, startRow, endCol, endRow] = rangeMatch;
        const result = {
          startRow: parseInt(startRow) - 1,
          startCol: startCol.charCodeAt(0) - 65,
          endRow: parseInt(endRow) - 1,
          endCol: endCol.charCodeAt(0) - 65
        };
        console.log('📊 범위 형식 파싱 결과:', result);
        return result;
      }

      // A1 형식 파싱
      const cellMatch = range.match(/([A-Z]+)(\d+)/);
      if (cellMatch) {
        const [, col, row] = cellMatch;
        const rowIndex = parseInt(row) - 1;
        const colIndex = col.charCodeAt(0) - 65;
        const result = {
          startRow: rowIndex,
          startCol: colIndex,
          endRow: rowIndex,
          endCol: colIndex
        };
        console.log('🎯 단일 셀 파싱 결과:', result);
        return result;
      }

      console.warn('⚠️ 셀 범위 파싱 실패 - 패턴 매치 실패:', range);
      return null;
    } catch (error) {
      console.error('❌ 셀 범위 파싱 중 오류:', error);
      return null;
    }
  }, []);

  // 변경사항 시각화 함수 - 변경되는 영역에 애니메이션 테두리 효과
  const highlightChangedArea = useCallback((targetRange: string, worksheet: any) => {
    try {
      console.log('🎯 하이라이트 효과 시작:', { targetRange, worksheet: !!worksheet });
      
      console.log('🔍 GC 객체 확인:', { 
        GC: !!GC, 
        Sheets: GC?.Spread?.Sheets ? 'Available' : 'Unavailable',
        LineBorder: GC?.Spread?.Sheets?.LineBorder ? 'Available' : 'Unavailable',
        LineStyle: GC?.Spread?.Sheets?.LineStyle ? 'Available' : 'Unavailable'
      });

      if (!worksheet) {
        console.warn('⚠️ worksheet가 없음:', { worksheet: !!worksheet });
        return;
      }

      const parsedRange = parseCellRange(targetRange);
      console.log('📍 파싱된 범위:', parsedRange);
      
      if (!parsedRange) {
        console.warn('⚠️ 범위 파싱 실패');
        return;
      }

      const { startRow, startCol, endRow, endCol } = parsedRange;
      
      // 변경 영역에 하이라이트 테두리 적용
      const range = worksheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1);
      console.log('📊 SpreadJS 범위 객체 생성:', { 
        range: !!range,
        startRow,
        startCol,
        rowCount: endRow - startRow + 1,
        colCount: endCol - startCol + 1
      });

      // 애니메이션용 테두리 스타일 (파란색 얇은 테두리)
      const highlightBorder = new GC.Spread.Sheets.LineBorder('#005de9', GC.Spread.Sheets.LineStyle.thin);
      console.log('🎨 하이라이트 테두리 생성:', highlightBorder);
      
      // 테두리 적용 (모든 면에 적용) - 파란색 테두리 영구 유지
      console.log('🖌️ 테두리 적용 시작...');
      range.setBorder(highlightBorder, { outline: true });
      console.log('✅ 테두리 적용 완료 - 파란색 테두리 영구 유지');

      console.log(`✅ 변경사항 하이라이트 적용 성공: ${targetRange}`);
    } catch (error) {
      console.error('❌ 하이라이트 효과 적용 실패:', error);
    }
  }, [parseCellRange]);

  // 실행 전 예고 효과 - 점선 테두리로 실행 예정 영역 표시
  const previewChangedArea = useCallback((targetRange: string, worksheet: any) => {
    try {
      console.log('👀 예고 효과 시작:', { targetRange, worksheet: !!worksheet });
      
      console.log('🔍 예고 효과 GC 객체 확인:', { 
        GC: !!GC, 
        Sheets: GC?.Spread?.Sheets ? 'Available' : 'Unavailable'
      });

      if (!worksheet) {
        console.warn('⚠️ 예고 효과 - worksheet가 없음:', { worksheet: !!worksheet });
        return;
      }

      const parsedRange = parseCellRange(targetRange);
      console.log('📍 예고 효과 파싱된 범위:', parsedRange);
      
      if (!parsedRange) {
        console.warn('⚠️ 예고 효과 범위 파싱 실패');
        return;
      }

      const { startRow, startCol, endRow, endCol } = parsedRange;
      
      // 예고 영역에 점선 테두리 적용
      const range = worksheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1);
      console.log('📊 예고 효과 범위 객체 생성:', { 
        range: !!range,
        startRow,
        startCol,
        rowCount: endRow - startRow + 1,
        colCount: endCol - startCol + 1
      });
      
      // 예고용 테두리 스타일 (주황색 점선)
      const previewBorder = new GC.Spread.Sheets.LineBorder('#ff6600', GC.Spread.Sheets.LineStyle.dashed);
      console.log('🎨 예고 테두리 생성:', previewBorder);
      
      // 점선 테두리 적용
      console.log('🖌️ 예고 테두리 적용 시작...');
      range.setBorder(previewBorder, { outline: true });
      console.log('✅ 예고 테두리 적용 완료');

      console.log(`✅ 변경사항 예고 효과 적용 성공: ${targetRange}`);
      
      // 예고 효과는 실행 직후에 제거됨 (highlightChangedArea에서 덮어쓰게 됨)
    } catch (error) {
      console.error('❌ 예고 효과 적용 실패:', error);
    }
  }, [parseCellRange]);

  // 테두리 제거 함수 - 사용자가 "적용 유지"를 눌렀을 때 사용
  const clearHighlightBorder = useCallback((targetRange: string) => {
    try {
      console.log('🗑️ 테두리 제거 시작:', targetRange);
      
      if (!spreadRef.current) {
        console.warn('⚠️ SpreadJS 인스턴스가 없음');
        return;
      }

      const worksheet = spreadRef.current.getActiveSheet();
      if (!worksheet) {
        console.warn('⚠️ 활성 시트가 없음');
        return;
      }

      const parsedRange = parseCellRange(targetRange);
      if (!parsedRange) {
        console.warn('⚠️ 범위 파싱 실패');
        return;
      }

      const { startRow, startCol, endRow, endCol } = parsedRange;
      const range = worksheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1);
      
      // 테두리 완전 제거
      range.setBorder(null, { outline: true });
      
      console.log('✅ 테두리 제거 완료:', targetRange);
    } catch (error) {
      console.error('❌ 테두리 제거 실패:', error);
    }
  }, [parseCellRange, spreadRef]);

  // 명령어 안전성 검사
  const validateCommand = useCallback((command: string, response: FormulaResponse): boolean => {
    try {
      console.log('🔍 명령어 검증 시작...', { command, response });

      // SpreadJS 인스턴스 확인
      if (!spreadRef.current) {
        console.error('❌ SpreadJS 인스턴스가 없습니다.');
        throw new Error('SpreadJS 인스턴스가 없습니다.');
      }
      console.log('✅ SpreadJS 인스턴스 확인 완료');

      const sheet = spreadRef.current.getActiveSheet();
      if (!sheet) {
        console.error('❌ 활성 시트가 없습니다.');
        throw new Error('활성 시트가 없습니다.');
      }
      console.log('✅ 활성 시트 확인 완료');

      // 대상 범위 검증
      const targetCells = response.implementation?.cellLocations?.target;
      console.log('🎯 대상 셀:', targetCells);

      if (targetCells) {
        const targetRange = parseCellRange(targetCells);
        console.log('📍 파싱된 범위:', targetRange);

        if (targetRange) {
          const maxRow = sheet.getRowCount();
          const maxCol = sheet.getColumnCount();
          console.log('📊 시트 크기:', { maxRow, maxCol });

          if (targetRange.startRow >= maxRow || targetRange.startCol >= maxCol ||
              targetRange.endRow >= maxRow || targetRange.endCol >= maxCol) {
            console.error('❌ 대상 범위가 시트 범위를 벗어남:', {
              targetRange,
              sheetSize: { maxRow, maxCol }
            });
            throw new Error('대상 범위가 시트 범위를 벗어납니다.');
          }
          console.log('✅ 범위 검증 통과');
        }
      }

      // 위험한 명령어 체크
      const dangerousPatterns = [
        'clearAll',
        'deleteSheet',
        'removeSheet',
        'destroy'
      ];

      const hasDangerousPattern = dangerousPatterns.some(pattern => command.includes(pattern));
      if (hasDangerousPattern) {
        console.error('❌ 위험한 명령어 감지:', command);
        throw new Error('위험한 명령어가 감지되었습니다.');
      }
      console.log('✅ 위험한 명령어 체크 통과');

      console.log('✅ 명령어 검증 완료 성공');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 명령어 검증 실패:', errorMessage);
      
      setState(prev => ({
        ...prev,
        error: errorMessage
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
    const targetRange = response.implementation.cellLocations.target;

    // 이미 실행 중인 경우 중단
    if (state.isExecuting) {
      throw new Error('이미 명령어가 실행 중입니다.');
    }

    const worksheet = spreadRef.current?.getActiveSheet();
    if (!worksheet) {
      throw new Error('활성 시트가 없습니다.');
    }

    // 실행 예고 효과 - 점선 테두리로 변경될 영역 미리 표시
    previewChangedArea(targetRange, worksheet);

    // 사용자 확인이 필요한 경우
    if (requireConfirmation) {
      const confirmed = window.confirm(
        `다음 작업을 실행하시겠습니까?\n\n${response.analysis.detectedOperation}\n대상: ${response.implementation.cellLocations.target}`
      );
      if (!confirmed) {
        // 취소 시 예고 효과 제거
        try {
          const parsedRange = parseCellRange(targetRange);
          if (parsedRange) {
            const { startRow, startCol, endRow, endCol } = parsedRange;
            const range = worksheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1);
            const transparentBorder = new GC.Spread.Sheets.LineBorder('transparent', GC.Spread.Sheets.LineStyle.thin);
            range.setBorder(transparentBorder, { outline: true });
          }
        } catch (error) {
          console.warn('예고 효과 제거 실패:', error);
        }
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

      // 성공 시 변경 영역 하이라이트 효과 적용
      highlightChangedArea(targetRange, worksheet);

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

      // 실패 시에도 예고 효과 제거
      try {
        const parsedRange = parseCellRange(targetRange);
        if (parsedRange) {
          const { startRow, startCol, endRow, endCol } = parsedRange;
          const range = worksheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1);
          const transparentBorder = new GC.Spread.Sheets.LineBorder('transparent', GC.Spread.Sheets.LineStyle.thin);
          range.setBorder(transparentBorder, { outline: true });
        }
      } catch (borderError) {
        console.warn('실패 후 테두리 제거 실패:', borderError);
      }

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
  }, [state.isExecuting, requireConfirmation, validateCommand, executeCommand, updateHistory, onSuccess, onError, parseCellRange, previewChangedArea, highlightChangedArea, spreadRef]);

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

    // 시각적 피드백 함수들
    highlightChangedArea,
    previewChangedArea,
    clearHighlightBorder,

    // 유틸리티
    parseCellRange,
    identifyCommandType
  };
};

export type { FormulaResponse, ExecutionResult, SpreadjsCommandEngineState, UseSpreadjsCommandEngineOptions };
