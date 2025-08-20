"use client";

import { useCallback, useRef, RefObject, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  useSpreadjsCommandStore as useCommandStore,
  SpreadsheetSnapshot,
  ExecutionSnapshot,
  RollbackOptions,
  generateChecksum,
  type SpreadjsCommandStoreState
} from '@/_store/sheet/spreadjsCommandStore';
import { 
  useSpreadjsCommandEngine,
  type FormulaResponse,
  type ExecutionResult,
  type UseSpreadjsCommandEngineOptions
} from './useSpreadjsCommandEngine';

// Hook 옵션 타입
interface UseSpreadjsCommandStoreOptions {
  // CommandEngine 옵션들
  requireConfirmation?: boolean;
  enableEngineHistory?: boolean;
  
  // 스냅샷 관련 옵션
  enableSnapshot?: boolean;
  snapshotDescription?: string;
  
  // 자동저장 관련 옵션
  enableAutosave?: boolean;
  autosaveDelay?: number;
  onAutosaveSuccess?: () => void;
  onAutosaveError?: (error: Error) => void;
  
  // 롤백 관련 옵션
  
  // 콜백 함수들
  onCommandSuccess?: (result: ExecutionResult, snapshot: ExecutionSnapshot) => void;
  onCommandError?: (error: Error, command: string) => void;
  onRollbackSuccess?: (restoredSnapshot: ExecutionSnapshot) => void;
  onRollbackError?: (error: Error) => void;
  onSnapshotCreated?: (snapshot: SpreadsheetSnapshot) => void;
}

// Hook 반환 타입
interface UseSpreadjsCommandStoreReturn {
  // 상태
  isExecuting: boolean;
  canRollback: boolean;
  executionHistory: ExecutionSnapshot[];
  autosaveStatus: SpreadjsCommandStoreState['autosave'];
  currentSnapshot: SpreadsheetSnapshot | null;
  
  // 명령어 실행
  executeCommand: (response: FormulaResponse) => Promise<void>;
  
  // 롤백 기능
  rollback: (options?: RollbackOptions) => Promise<void>;
  canPerformRollback: () => boolean;
  
  // 스냅샷 관리
  createSnapshot: (description?: string) => Promise<SpreadsheetSnapshot>;
  restoreSnapshot: (snapshot: SpreadsheetSnapshot) => Promise<void>;
  
  // 자동저장 추후 연동 예정
  // triggerAutosave: () => Promise<void>;
  
  // 히스토리 관리
  clearHistory: () => void;
  getHistoryByRange: (range: string) => ExecutionSnapshot[];
  getLastExecutions: (count: number) => ExecutionSnapshot[];
  
  // 설정
  updateSettings: (settings: Partial<SpreadjsCommandStoreState['settings']>) => void;
  
  // 상태 리셋
  resetStore: () => void;
}

// 메인 Hook
export const useSpreadjsCommandManager = (
  spreadRef: RefObject<any>,
  options: UseSpreadjsCommandStoreOptions = {}
): UseSpreadjsCommandStoreReturn => {
  
  const {
    requireConfirmation = false,
    enableEngineHistory = false,
    enableSnapshot = true,
    enableAutosave = true,
    autosaveDelay = 2000,
    onCommandSuccess,
    onCommandError,
    onRollbackSuccess,
    onRollbackError,
    onSnapshotCreated,
    onAutosaveSuccess,
    onAutosaveError,
  } = options;

  // Zustand 스토어 상태와 액션 분리
  const {
    // 상태
    isExecuting,
    currentCommand,
    executionHistory,
    rollbackStack,
    canRollback,
    autosave,
    currentSnapshot,
    settings,
    // 액션
    setExecuting,
    addExecutionSnapshot,
    clearExecutionHistory,
    setCurrentSnapshot,
    addSnapshotToCache,
    removeFromRollbackStack,
    canPerformRollback,
    setAutosavePending,
    setAutosaveInProgress,
    setLastSavedAt,
    incrementSaveCount,
    setAutosaveError,
    getExecutionHistoryByRange,
    getLastNExecutions,
    getExecutionById,
    updateSettings,
    resetStore
  } = useCommandStore();
  
  // 자동저장 타이머 참조
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // CommandEngine Hook 설정
  const engineOptions = useMemo<UseSpreadjsCommandEngineOptions>(() => ({
    requireConfirmation,
    enableHistory: enableEngineHistory,
    onSuccess: async () => {
      // Engine 성공 시 처리는 executeCommand에서 통합 관리
    },
    onError: (error: Error) => {
      setExecuting(false);
      onCommandError?.(error, currentCommand || '');
    }
  }), [requireConfirmation, enableEngineHistory, onCommandError, setExecuting, currentCommand]);

  const commandEngine = useSpreadjsCommandEngine(spreadRef, engineOptions);

  // 스냅샷 생성
  const createSnapshot = useCallback(async (description?: string): Promise<SpreadsheetSnapshot> => {
    if (!spreadRef.current) {
      throw new Error('SpreadJS 인스턴스가 없습니다.');
    }

    try {
      spreadRef.current.getActiveSheet();
      const sheetData = spreadRef.current.toJSON({
        includeBindingSource: true,
        ignoreFormula: false,
        ignoreStyle: false,
        saveAsView: true
      });

      const snapshot: SpreadsheetSnapshot = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sheetData,
        affectedRange: 'A1:Z1000', // 전체 범위로 기본 설정
        checksum: generateChecksum(sheetData),
        description: description || 'Auto snapshot'
      };

      if (enableSnapshot) {
        addSnapshotToCache(snapshot);
        setCurrentSnapshot(snapshot);
        onSnapshotCreated?.(snapshot);
      }

      return snapshot;
    } catch (error) {
      throw new Error(`스냅샷 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [spreadRef, enableSnapshot, addSnapshotToCache, setCurrentSnapshot, onSnapshotCreated]);

  // 스냅샷 복원
  const restoreSnapshot = useCallback(async (snapshot: SpreadsheetSnapshot): Promise<void> => {
    if (!spreadRef.current) {
      throw new Error('SpreadJS 인스턴스가 없습니다.');
    }

    try {
      // 체크섬 검증
      const currentChecksum = generateChecksum(snapshot.sheetData);
      if (currentChecksum !== snapshot.checksum) {
        throw new Error('스냅샷 데이터가 손상되었습니다.');
      }

      // 데이터를 깊은 복사하여 extensible하게 만듦
      const clonedData = JSON.parse(JSON.stringify(snapshot.sheetData));

      // SpreadJS에 데이터 로드 - 동기적 방식으로 시도
      try {
        console.log('🔄 fromJSON 동기 호출 시도...');
        spreadRef.current.fromJSON(clonedData);
        
        // 잠시 대기하여 SpreadJS가 처리할 시간을 줌
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // SpreadJS 렌더링 강제 새로고침
        try {
          spreadRef.current.refresh();
          console.log('🔄 SpreadJS refresh 완료');
        } catch (refreshError) {
          console.log('⚠️ refresh 실패, 무시:', refreshError);
        }
        
        setCurrentSnapshot(snapshot);
        console.log('✅ 스냅샷 복원 성공 (동기)');
        
      } catch (error) {
        console.log('❌ 동기 방식 실패, 콜백 방식으로 재시도...', error);
        
        // 동기 방식 실패 시 콜백 방식으로 재시도
        await new Promise<void>((resolve, reject) => {
          let resolved = false;
          
          const timeoutId = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              console.log('⏰ fromJSON 콜백 타임아웃');
              reject(new Error('fromJSON 콜백 타임아웃'));
            }
          }, 5000);
          
          try {
            spreadRef.current.fromJSON(clonedData, (success: boolean) => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                
                if (success) {
                  // SpreadJS 렌더링 강제 새로고침
                  try {
                    spreadRef.current.refresh();
                    console.log('🔄 SpreadJS refresh 완료 (콜백)');
                  } catch (refreshError) {
                    console.log('⚠️ refresh 실패, 무시:', refreshError);
                  }
                  
                  setCurrentSnapshot(snapshot);
                  console.log('✅ 스냅샷 복원 성공 (콜백)');
                  resolve();
                } else {
                  reject(new Error('fromJSON 콜백에서 실패를 반환했습니다.'));
                }
              }
            });
          } catch (callbackError) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              reject(new Error(`fromJSON 콜백 실행 실패: ${callbackError instanceof Error ? callbackError.message : String(callbackError)}`));
            }
          }
        });
      }

    } catch (error) {
      throw new Error(`스냅샷 복원 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [spreadRef, setCurrentSnapshot]);

  // 자동저장 트리거
  const triggerAutosave = useCallback(async (): Promise<void> => {
    if (!enableAutosave || autosave.isInProgress) {
      return;
    }

    // 기존 타이머 취소
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // 지연 후 저장 실행
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        setAutosaveInProgress(true);
        
        // 현재 스냅샷 생성
        await createSnapshot('Autosave snapshot');
        
        // TODO: 백엔드 API 호출 로직 추가
        // await saveToBackend(snapshot);
        
        setLastSavedAt(new Date().toISOString());
        incrementSaveCount();
        onAutosaveSuccess?.();
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setAutosaveError(errorMessage);
        onAutosaveError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        setAutosaveInProgress(false);
      }
    }, autosaveDelay);
  }, [enableAutosave, autosave.isInProgress, setAutosaveInProgress, createSnapshot, setLastSavedAt, incrementSaveCount, setAutosaveError, autosaveDelay, onAutosaveSuccess, onAutosaveError]);

  // 통합 명령어 실행
  const executeCommand = useCallback(async (response: FormulaResponse): Promise<void> => {
    if (isExecuting) {
      throw new Error('이미 명령어가 실행 중입니다.');
    }

    const command = response.formulaDetails?.spreadjsCommand;
    if (!command) {
      throw new Error('실행할 명령어가 없습니다.');
    }

    try {
      setExecuting(true, command);
      
      // 1. 실행 전 스냅샷 생성
      const beforeSnapshot = await createSnapshot(`실행 전: ${response.analysis.detectedOperation}`);
      
      // 2. CommandEngine으로 명령어 실행
      await commandEngine.executeFormulaResponse(response);
      
      // 3. 실행 후 스냅샷 생성
      const afterSnapshot = await createSnapshot(`실행 후: ${response.analysis.detectedOperation}`);
      
      // 4. ExecutionSnapshot 생성 및 스토어에 추가
      const executionSnapshot: ExecutionSnapshot = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        command,
        commandType: commandEngine.identifyCommandType(command),
        beforeState: beforeSnapshot,
        afterState: afterSnapshot,
        description: response.analysis.detectedOperation,
        targetRange: response.implementation.cellLocations.target,
        success: true
      };

      addExecutionSnapshot(executionSnapshot);
      
      // 5. 자동저장 트리거
      if (enableAutosave) {
        setAutosavePending(true, 1);
        await triggerAutosave();
      }
      
      // 6. 성공 콜백 호출
      onCommandSuccess?.(commandEngine.lastResult!, executionSnapshot);
      
    } catch (error) {
      // 실패한 경우 실행 스냅샷 생성 (실패 기록용)
      try {
        const beforeSnapshot = currentSnapshot;
        if (beforeSnapshot) {
          const failedSnapshot: ExecutionSnapshot = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            command,
            commandType: commandEngine.identifyCommandType(command),
            beforeState: beforeSnapshot,
            afterState: beforeSnapshot, // 실패 시 동일한 상태
            description: `실패: ${response.analysis.detectedOperation}`,
            targetRange: response.implementation.cellLocations.target,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
          
          addExecutionSnapshot(failedSnapshot);
        }
      } catch (snapshotError) {
        console.warn('실패 스냅샷 생성 중 오류:', snapshotError);
      }
      
      onCommandError?.(error instanceof Error ? error : new Error(String(error)), command);
      throw error;
      
    } finally {
      setExecuting(false);
    }
  }, [
    isExecuting,
    setExecuting,
    createSnapshot, 
    commandEngine, 
    addExecutionSnapshot,
    enableAutosave,
    setAutosavePending, 
    triggerAutosave, 
    onCommandSuccess,
    currentSnapshot,
    onCommandError
  ]);

  // 롤백 실행
  const rollback = useCallback(async (options: RollbackOptions = { type: 'single' }): Promise<void> => {
    console.log('🔧 rollback 함수 시작:', options);
    
    if (!canPerformRollback()) {
      console.log('❌ canPerformRollback 실패');
      throw new Error('롤백을 수행할 수 없습니다.');
    }

    console.log('✅ canPerformRollback 통과');

    try {
      const { type, steps = 1, targetId } = options;
      console.log('📋 롤백 옵션:', { type, steps, targetId });
      
      let targetSnapshot: ExecutionSnapshot | undefined;
      
      switch (type) {
        case 'single': {
          targetSnapshot = rollbackStack[0];
          console.log('🎯 single 타입 롤백, 대상:', targetSnapshot?.id);
          break;
        }
          
        case 'multiple': {
          const targetIndex = Math.min(steps - 1, rollbackStack.length - 1);
          targetSnapshot = rollbackStack[targetIndex];
          console.log('🎯 multiple 타입 롤백, 인덱스:', targetIndex);
          break;
        }
          
        case 'selective': {
          if (targetId) {
            targetSnapshot = getExecutionById(targetId);
          }
          console.log('🎯 selective 타입 롤백, ID:', targetId);
          break;
        }
          
        default:
          throw new Error('지원하지 않는 롤백 타입입니다.');
      }
      
      if (!targetSnapshot) {
        console.log('❌ 롤백할 대상이 없음');
        throw new Error('롤백할 대상을 찾을 수 없습니다.');
      }
      
      console.log('✅ 롤백 대상 발견:', targetSnapshot.description);
      
      // 사용자 확인
      if (settings.confirmBeforeRollback) {
        console.log('⏸️ 사용자 확인 대기 중...');
        const confirmed = window.confirm(
          `다음 작업을 롤백하시겠습니까?\n\n${targetSnapshot.description}\n시간: ${new Date(targetSnapshot.timestamp).toLocaleString()}`
        );
        if (!confirmed) {
          console.log('❌ 사용자가 롤백 취소');
          throw new Error('사용자가 롤백을 취소했습니다.');
        }
        console.log('✅ 사용자 확인 완료');
      }
      
      console.log('🔄 스냅샷 복원 시작...');
      // beforeState로 복원
      await restoreSnapshot(targetSnapshot.beforeState);
      console.log('✅ 스냅샷 복원 완료');
      
      console.log('🗑️ 롤백 스택에서 제거 중...');
      // 롤백 스택에서 제거
      const stepsToRemove = type === 'multiple' ? steps : 1;
      removeFromRollbackStack(stepsToRemove);
      console.log('✅ 롤백 스택 제거 완료');
      
      // 롤백 후에는 자동저장 생략 (불필요한 스냅샷 생성 방지)
      console.log('⏭️ 롤백 후 자동저장 생략 (안정성을 위해)');
      
      console.log('🎉 롤백 성공 콜백 호출');
      onRollbackSuccess?.(targetSnapshot);
      
      console.log('✅ 롤백 함수 완료');
      
    } catch (error) {
      console.log('❌ 롤백 함수에서 에러 발생:', error);
      onRollbackError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [
    canPerformRollback,
    rollbackStack,
    getExecutionById,
    settings.confirmBeforeRollback,
    restoreSnapshot,
    removeFromRollbackStack,
    enableAutosave,
    setAutosavePending,
    triggerAutosave,
    onRollbackSuccess,
    onRollbackError
  ]);

  // Cleanup on unmount
  useCallback(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  return {
    // 상태
    isExecuting: isExecuting,
    canRollback: canRollback,
    executionHistory: executionHistory,
    autosaveStatus: autosave,
    currentSnapshot: currentSnapshot,
    
    // 메서드
    executeCommand,
    rollback,
    canPerformRollback: canPerformRollback,
    createSnapshot,
    restoreSnapshot,
    // triggerAutosave, //자동저장로직은 추후 연동 예정
    
    // 히스토리 관리
    clearHistory: clearExecutionHistory,
    getHistoryByRange: getExecutionHistoryByRange,
    getLastExecutions: getLastNExecutions,
    
    // 설정
    updateSettings: updateSettings,
    resetStore: resetStore,
  };
};

// 타입 export
export type {
  UseSpreadjsCommandStoreOptions,
  UseSpreadjsCommandStoreReturn,
  RollbackOptions
};
