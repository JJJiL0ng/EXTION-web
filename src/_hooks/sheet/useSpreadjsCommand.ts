import { useCallback, useRef, useState, useEffect } from 'react';
import * as GC from '@mescius/spread-sheets';

// 실행 결과 인터페이스
export interface SpreadJSExecutionResult {
  success: boolean;
  executedCommand: string;
  affectedCells: string;
  errorMessage?: string;
  executionTime: number;
  resultData?: any;
  performanceMetrics?: {
    cellsProcessed: number;
    formulasApplied: number;
    stylesUpdated: number;
  };
  validationResults?: {
    preValidation: boolean;
    postValidation: boolean;
    warnings: string[];
  };
}

// 실행 옵션 인터페이스
export interface ExecutionOptions {
  validateBeforeExecution?: boolean;
  validateAfterExecution?: boolean;
  logExecution?: boolean;
  showProgress?: boolean;
  timeout?: number; // 실행 제한 시간 (ms)
  rollbackOnError?: boolean; // 에러 시 롤백
  onProgress?: (step: string, progress: number) => void;
  onSuccess?: (result: SpreadJSExecutionResult) => void;
  onError?: (error: Error, command: string) => void;
  onWarning?: (warning: string) => void;
}

// 성능 모니터링
interface PerformanceMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
}

// Hook 반환 타입
export interface UseSpreadJSCommandReturn {
  executeCommand: (command: string, options?: ExecutionOptions) => Promise<SpreadJSExecutionResult>;
  executeBatch: (commands: string[], options?: ExecutionOptions) => Promise<SpreadJSExecutionResult[]>;
  isExecuting: boolean;
  lastResult: SpreadJSExecutionResult | null;
  executionHistory: SpreadJSExecutionResult[];
  performanceMetrics: PerformanceMetrics;
  clearHistory: () => void;
  rollbackLastCommand: () => Promise<boolean>;
  validateWorksheet: () => Promise<boolean>;
  getWorksheetData: () => any;
  refreshSpreadSheet: () => void;
}

/**
 * SpreadJS 명령어 실행을 위한 커스텀 Hook
 * MainSpreadSheet 컴포넌트와 완벽 호환되도록 설계
 */
export const useSpreadJSCommand = (
  spreadRef: React.RefObject<any>, // MainSpreadSheet의 spreadRef와 연동
  worksheetIndex: number = 0
): UseSpreadJSCommandReturn => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<SpreadJSExecutionResult | null>(null);
  const [executionHistory, setExecutionHistory] = useState<SpreadJSExecutionResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalExecutions: 0,
    successfulExecutions: 0,
    averageExecutionTime: 0,
    lastExecutionTime: 0
  });
  
  // 실행 상태 및 백업을 위한 ref
  const executionRef = useRef<boolean>(false);
  const workbookStateRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 현재 워크북과 워크시트 가져오기
  const getCurrentWorkbook = useCallback(() => {
    return spreadRef.current;
  }, [spreadRef]);

  const getCurrentWorksheet = useCallback(() => {
    const workbook = getCurrentWorkbook();
    if (!workbook) return null;
    
    try {
      return workbook.getSheet(worksheetIndex);
    } catch (error) {
      console.error('워크시트 가져오기 실패:', error);
      return null;
    }
  }, [getCurrentWorkbook, worksheetIndex]);

  // 워크북 상태 백업
  const backupWorkbookState = useCallback(() => {
    const worksheet = getCurrentWorksheet();
    if (!worksheet) return null;
    
    try {
      return {
        json: worksheet.toJSON({
          includeBindingSource: true,
          ignoreFormula: false,
          ignoreStyle: false,
          saveAsView: true
        }),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('워크북 상태 백업 실패:', error);
      return null;
    }
  }, [getCurrentWorksheet]);

  // 워크북 상태 복원
  const restoreWorkbookState = useCallback((backupState: any) => {
    const worksheet = getCurrentWorksheet();
    if (!worksheet || !backupState) return false;
    
    try {
      worksheet.fromJSON(backupState.json);
      return true;
    } catch (error) {
      console.error('워크북 상태 복원 실패:', error);
      return false;
    }
  }, [getCurrentWorksheet]);

  // 고급 명령어 유효성 검사
  const validateCommand = useCallback((command: string, worksheet: any): string[] => {
    const warnings: string[] = [];
    
    // 1. 기본 보안 검사
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /document\./i,
      /window\.(?!fs\.readFile)/i,
      /location\./i,
      /alert\s*\(/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error(`보안상 위험한 코드가 감지되었습니다: ${pattern.source}`);
      }
    }

    // 2. SpreadJS API 패턴 확인
    if (!/(worksheet|workbook|GC\.Spread\.Sheets\.)/i.test(command)) {
      warnings.push('SpreadJS API 패턴이 감지되지 않았습니다.');
    }

    // 3. setFormula에 SheetArea 파라미터 확인
    if (command.includes('setFormula') && !command.includes('SheetArea')) {
      warnings.push('setFormula 메서드에 SheetArea 파라미터 명시를 권장합니다.');
    }

    // 4. suspendPaint/resumePaint 페어 확인
    const hasSuspend = command.includes('suspendPaint');
    const hasResume = command.includes('resumePaint');
    if (hasSuspend && !hasResume) {
      warnings.push('suspendPaint()가 있지만 resumePaint()가 없습니다.');
    }

    // 5. 셀 인덱스 범위 확인
    const cellReferences = command.match(/\b(\d+),\s*(\d+)\b/g);
    if (cellReferences && worksheet) {
      const maxRows = worksheet.getRowCount();
      const maxCols = worksheet.getColumnCount();
      
      cellReferences.forEach(ref => {
        const [row, col] = ref.split(',').map(n => parseInt(n.trim()));
        if (row >= maxRows || col >= maxCols) {
          warnings.push(`셀 인덱스 (${row}, ${col})가 시트 범위를 벗어날 수 있습니다.`);
        }
      });
    }

    return warnings;
  }, []);

  // 실행 후 검증
  const validateExecutionResult = useCallback((
    worksheet: any,
    command: string
  ): boolean => {
    try {
      if (!worksheet) {
        console.error('워크시트가 유효하지 않습니다.');
        return false;
      }

      // setFormula 실행 검증
      if (command.includes('setFormula')) {
        const formulaMatches = command.match(/setFormula\((\d+),\s*(\d+),\s*['"`]([^'"`]+)['"`]/);
        if (formulaMatches) {
          const [, row, col, formula] = formulaMatches;
          const appliedFormula = worksheet.getFormula(parseInt(row), parseInt(col));
          
          if (!appliedFormula || !appliedFormula.includes(formula.replace(/['"]/g, ''))) {
            console.warn(`공식이 예상과 다르게 적용되었습니다. 예상: ${formula}, 실제: ${appliedFormula}`);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('실행 결과 검증 중 오류:', error);
      return false;
    }
  }, []);

  // 안전한 SpreadJS 명령 실행
  const executeSpreadJSCommandSafely = useCallback(async (
    worksheet: any,
    command: string,
    workbook: any
  ): Promise<{ affectedCells?: string; data?: any; cellsProcessed?: number; formulasApplied?: number; stylesUpdated?: number }> => {
    
    let cellsProcessed = 0;
    let formulasApplied = 0;
    let stylesUpdated = 0;

    // 실행 컨텍스트 생성
    const context = {
      worksheet,
      workbook,
      GC: GC,
      console: {
        log: (...args: any[]) => console.log('📊 SpreadJS:', ...args),
        error: (...args: any[]) => console.error('🔴 SpreadJS Error:', ...args),
        warn: (...args: any[]) => console.warn('⚠️ SpreadJS Warning:', ...args)
      }
    };

    try {
      // Function 생성자를 사용하여 안전하게 실행
      const func = new Function(
        'worksheet', 
        'workbook', 
        'GC', 
        'console',
        `
          ${command}
          
          // 실행 후 영향받은 셀 정보 반환
          try {
            const selection = worksheet.getSelections();
            const affectedCells = selection && selection.length > 0 
              ? selection.map(range => 
                  GC.Spread.Sheets.CalcEngine.rangeToFormula(range)
                ).join(', ')
              : '알 수 없음';
            
            return { 
              affectedCells,
              data: {
                selectionCount: selection ? selection.length : 0,
                activeRow: worksheet.getActiveRowIndex(),
                activeCol: worksheet.getActiveColumnIndex()
              },
              cellsProcessed: ${cellsProcessed},
              formulasApplied: ${formulasApplied},
              stylesUpdated: ${stylesUpdated}
            };
          } catch (e) {
            return { affectedCells: '감지 실패' };
          }
        `
      );

      const result = func(
        context.worksheet,
        context.workbook,
        context.GC,
        context.console
      );

      return result || { affectedCells: '실행 완료' };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`SpreadJS 명령 실행 실패: ${error.message}`);
      }
      throw new Error('알 수 없는 SpreadJS 실행 오류');
    }
  }, []);

  // 메인 실행 함수
  const executeCommand = useCallback(async (
    command: string,
    options: ExecutionOptions = {}
  ): Promise<SpreadJSExecutionResult> => {
    const startTime = Date.now();
    const {
      validateBeforeExecution = true,
      validateAfterExecution = false,
      logExecution = true,
      showProgress = false,
      timeout = 30000,
      rollbackOnError = false,
      onProgress,
      onSuccess,
      onError,
      onWarning
    } = options;

    // 중복 실행 방지
    if (executionRef.current) {
      throw new Error('이미 다른 명령이 실행 중입니다.');
    }

    // Workbook 유효성 검사
    const workbook = getCurrentWorkbook();
    if (!workbook) {
      const error = new Error('SpreadJS Workbook이 초기화되지 않았습니다.');
      onError?.(error, command);
      throw error;
    }

    setIsExecuting(true);
    executionRef.current = true;

    // 타임아웃 설정
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        const error = new Error(`실행 시간 초과 (${timeout}ms)`);
        onError?.(error, command);
        setIsExecuting(false);
        executionRef.current = false;
      }, timeout);
    }

    let backupState: any = null;
    
    try {
      // 백업 생성
      if (rollbackOnError) {
        onProgress?.('워크북 상태 백업 중...', 10);
        backupState = backupWorkbookState();
        workbookStateRef.current = backupState;
      }

      // 워크시트 가져오기
      onProgress?.('워크시트 준비 중...', 20);
      const worksheet = getCurrentWorksheet();
      if (!worksheet) {
        throw new Error(`워크시트 인덱스 ${worksheetIndex}를 찾을 수 없습니다.`);
      }

      // 사전 유효성 검사
      let warnings: string[] = [];
      if (validateBeforeExecution) {
        onProgress?.('명령어 유효성 검사 중...', 30);
        warnings = validateCommand(command, worksheet);
        
        warnings.forEach(warning => {
          console.warn('⚠️', warning);
          onWarning?.(warning);
        });
      }

      // 실제 명령어 실행
      onProgress?.('명령어 실행 중...', 50);
      
      if (logExecution) {
        console.log('🚀 SpreadJS Command 실행:', command);
      }

      const result = await executeSpreadJSCommandSafely(worksheet, command, workbook);

      // 사후 검증
      let postValidation = true;
      if (validateAfterExecution) {
        onProgress?.('실행 결과 검증 중...', 80);
        postValidation = validateExecutionResult(worksheet, command);
        
        if (!postValidation) {
          warnings.push('실행 결과 검증에서 이상이 감지되었습니다.');
        }
      }

      onProgress?.('실행 완료!', 100);

      const executionTime = Date.now() - startTime;
      const executionResult: SpreadJSExecutionResult = {
        success: true,
        executedCommand: command,
        affectedCells: result.affectedCells || '알 수 없음',
        executionTime,
        resultData: result.data,
        performanceMetrics: {
          cellsProcessed: result.cellsProcessed || 0,
          formulasApplied: result.formulasApplied || 0,
          stylesUpdated: result.stylesUpdated || 0
        },
        validationResults: {
          preValidation: warnings.length === 0,
          postValidation,
          warnings
        }
      };

      // 성능 메트릭 업데이트
      setPerformanceMetrics(prev => ({
        totalExecutions: prev.totalExecutions + 1,
        successfulExecutions: prev.successfulExecutions + 1,
        averageExecutionTime: (prev.averageExecutionTime * prev.totalExecutions + executionTime) / (prev.totalExecutions + 1),
        lastExecutionTime: executionTime
      }));

      setLastResult(executionResult);
      setExecutionHistory(prev => [...prev.slice(-19), executionResult]);

      onSuccess?.(executionResult);

      if (logExecution) {
        console.log('✅ 명령 실행 완료:', executionResult);
      }

      return executionResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      
      // 롤백 처리
      if (rollbackOnError && backupState) {
        console.log('🔄 오류 발생으로 인한 롤백 실행...');
        const rollbackSuccess = restoreWorkbookState(backupState);
        if (rollbackSuccess) {
          console.log('✅ 롤백 완료');
        } else {
          console.error('❌ 롤백 실패');
        }
      }

      const executionResult: SpreadJSExecutionResult = {
        success: false,
        executedCommand: command,
        affectedCells: '없음',
        errorMessage,
        executionTime
      };

      setPerformanceMetrics(prev => ({
        ...prev,
        totalExecutions: prev.totalExecutions + 1,
        lastExecutionTime: executionTime
      }));

      setLastResult(executionResult);
      setExecutionHistory(prev => [...prev.slice(-19), executionResult]);

      onError?.(error as Error, command);

      if (logExecution) {
        console.error('❌ 명령 실행 실패:', error);
      }

      throw error;

    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setIsExecuting(false);
      executionRef.current = false;
    }
  }, [getCurrentWorkbook, getCurrentWorksheet, validateCommand, validateExecutionResult, backupWorkbookState, restoreWorkbookState, executeSpreadJSCommandSafely, worksheetIndex]);

  // 배치 실행
  const executeBatch = useCallback(async (
    commands: string[],
    options: ExecutionOptions = {}
  ): Promise<SpreadJSExecutionResult[]> => {
    const results: SpreadJSExecutionResult[] = [];
    
    for (let i = 0; i < commands.length; i++) {
      try {
        options.onProgress?.(`배치 실행 중... (${i + 1}/${commands.length})`, (i / commands.length) * 100);
        const result = await executeCommand(commands[i], {
          ...options,
          onProgress: undefined
        });
        results.push(result);
      } catch (error) {
        const errorResult: SpreadJSExecutionResult = {
          success: false,
          executedCommand: commands[i],
          affectedCells: '없음',
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
          executionTime: 0
        };
        results.push(errorResult);
        
        if (options.rollbackOnError) {
          break;
        }
      }
    }
    
    return results;
  }, [executeCommand]);

  // 마지막 명령 롤백
  const rollbackLastCommand = useCallback(async (): Promise<boolean> => {
    if (!workbookStateRef.current) {
      console.warn('롤백할 상태가 없습니다.');
      return false;
    }
    
    return restoreWorkbookState(workbookStateRef.current);
  }, [restoreWorkbookState]);

  // 워크시트 유효성 검사
  const validateWorksheet = useCallback(async (): Promise<boolean> => {
    const worksheet = getCurrentWorksheet();
    if (!worksheet) return false;
    
    try {
      const rowCount = worksheet.getRowCount();
      const colCount = worksheet.getColumnCount();
      
      console.log(`📊 워크시트 상태: ${rowCount}행 x ${colCount}열`);
      
      return rowCount > 0 && colCount > 0;
    } catch (error) {
      console.error('워크시트 검증 실패:', error);
      return false;
    }
  }, [getCurrentWorksheet]);

  // 워크시트 데이터 가져오기
  const getWorksheetData = useCallback(() => {
    const worksheet = getCurrentWorksheet();
    if (!worksheet) return null;
    
    try {
      return worksheet.toJSON({
        includeBindingSource: true,
        ignoreFormula: false,
        ignoreStyle: false,
        saveAsView: true
      });
    } catch (error) {
      console.error('워크시트 데이터 가져오기 실패:', error);
      return null;
    }
  }, [getCurrentWorksheet]);

  // SpreadSheet 새로고침
  const refreshSpreadSheet = useCallback(() => {
    const workbook = getCurrentWorkbook();
    if (workbook) {
      try {
        workbook.refresh();
        console.log('✅ SpreadSheet 새로고침 완료');
      } catch (error) {
        console.error('❌ SpreadSheet 새로고침 실패:', error);
      }
    }
  }, [getCurrentWorkbook]);

  // 히스토리 정리
  const clearHistory = useCallback(() => {
    setExecutionHistory([]);
    setLastResult(null);
    setPerformanceMetrics({
      totalExecutions: 0,
      successfulExecutions: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0
    });
  }, []);

  return {
    executeCommand,
    executeBatch,
    isExecuting,
    lastResult,
    executionHistory,
    performanceMetrics,
    clearHistory,
    rollbackLastCommand,
    validateWorksheet,
    getWorksheetData,
    refreshSpreadSheet
  };
};