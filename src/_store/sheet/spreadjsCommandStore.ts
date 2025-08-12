"use client";

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Immer MapSet 플러그인 활성화
enableMapSet();

// 스프레드시트 스냅샷 타입
interface SpreadsheetSnapshot {
  id: string;
  timestamp: string;
  sheetData: any; // SpreadJS JSON 데이터
  affectedRange: string;
  checksum: string; // 데이터 무결성 확인용
  description: string;
}

// 실행 스냅샷 타입 (롤백용)
interface ExecutionSnapshot {
  id: string;
  timestamp: string;
  command: string;
  commandType: string;
  beforeState: SpreadsheetSnapshot; // 실행 전 상태
  afterState: SpreadsheetSnapshot;  // 실행 후 상태
  description: string;
  targetRange: string;
  success: boolean;
  error?: string;
}

// 자동저장 상태 타입
interface AutosaveState {
  isPending: boolean;
  isInProgress: boolean;
  lastSavedAt: string | null;
  nextSaveAt: string | null;
  saveCount: number;
  queuedChanges: number;
  error: string | null;
}

// 롤백 설정 타입
interface RollbackOptions {
  type: 'single' | 'multiple' | 'selective';
  targetId?: string; // 특정 명령어 ID로 롤백
  steps?: number;    // N단계 롤백
  range?: string;    // 특정 범위만 롤백
}

// 메인 스토어 상태 타입
interface SpreadjsCommandStoreState {
  // 실행 히스토리 (롤백용)
  executionHistory: ExecutionSnapshot[];
  
  // 현재 실행 상태
  isExecuting: boolean;
  currentCommand: string | null;
  
  // 롤백 관련
  rollbackStack: ExecutionSnapshot[];
  canRollback: boolean;
  maxHistorySize: number;
  
  // 자동저장 관련
  autosave: AutosaveState;
  
  // 스냅샷 관리
  currentSnapshot: SpreadsheetSnapshot | null;
  snapshotCache: Map<string, SpreadsheetSnapshot>;
  
  // 설정
  settings: {
    autoSaveEnabled: boolean;
    autoSaveInterval: number; // ms
    confirmBeforeRollback: boolean;
    maxRollbackSteps: number;
  };
}

// 스토어 액션 타입
interface SpreadjsCommandStoreActions {
  // 실행 관리
  setExecuting: (isExecuting: boolean, command?: string) => void;
  addExecutionSnapshot: (snapshot: ExecutionSnapshot) => void;
  clearExecutionHistory: () => void;
  
  // 스냅샷 관리
  setCurrentSnapshot: (snapshot: SpreadsheetSnapshot | null) => void;
  addSnapshotToCache: (snapshot: SpreadsheetSnapshot) => void;
  getSnapshotFromCache: (id: string) => SpreadsheetSnapshot | undefined;
  clearSnapshotCache: () => void;
  
  // 롤백 관리
  addToRollbackStack: (snapshot: ExecutionSnapshot) => void;
  removeFromRollbackStack: (count?: number) => ExecutionSnapshot[];
  canPerformRollback: () => boolean;
  clearRollbackStack: () => void;
  
  // 자동저장 관리
  setAutosavePending: (pending: boolean, changesCount?: number) => void;
  setAutosaveInProgress: (inProgress: boolean) => void;
  setLastSavedAt: (timestamp: string) => void;
  setNextSaveAt: (timestamp: string | null) => void;
  incrementSaveCount: () => void;
  setAutosaveError: (error: string | null) => void;
  resetAutosaveState: () => void;
  
  // 설정 관리
  updateSettings: (newSettings: Partial<SpreadjsCommandStoreState['settings']>) => void;
  
  // 유틸리티
  getExecutionHistoryByRange: (range: string) => ExecutionSnapshot[];
  getLastNExecutions: (count: number) => ExecutionSnapshot[];
  getExecutionById: (id: string) => ExecutionSnapshot | undefined;
  
  // 전체 상태 리셋
  resetStore: () => void;
}

// 초기 상태
const initialState: SpreadjsCommandStoreState = {
  executionHistory: [],
  isExecuting: false,
  currentCommand: null,
  rollbackStack: [],
  canRollback: false,
  maxHistorySize: 100,
  autosave: {
    isPending: false,
    isInProgress: false,
    lastSavedAt: null,
    nextSaveAt: null,
    saveCount: 0,
    queuedChanges: 0,
    error: null,
  },
  currentSnapshot: null,
  snapshotCache: new Map(),
  settings: {
    autoSaveEnabled: true,
    autoSaveInterval: 30000, // 30초
    confirmBeforeRollback: true,
    maxRollbackSteps: 50,
  },
};

// 체크섬 생성 유틸리티 (유니코드 안전)
const generateChecksum = (data: any): string => {
  try {
    // JSON 문자열화
    const jsonString = JSON.stringify(data);
    
    // 유니코드 문자를 안전하게 Base64로 인코딩
    // encodeURIComponent로 먼저 인코딩한 후 btoa 사용
    const encodedString = encodeURIComponent(jsonString);
    const base64String = btoa(encodedString);
    
    return base64String.slice(0, 16);
  } catch (error) {
    // btoa 실패 시 간단한 해시 생성
    console.warn('Base64 인코딩 실패, 대체 해시 사용:', error);
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 16);
  }
};

// Zustand 스토어 생성
export const useSpreadjsCommandStore = create<
  SpreadjsCommandStoreState & SpreadjsCommandStoreActions
>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // 실행 관리
        setExecuting: (isExecuting: boolean, command?: string) => {
          set((state) => {
            state.isExecuting = isExecuting;
            state.currentCommand = command || null;
          });
        },

        addExecutionSnapshot: (snapshot: ExecutionSnapshot) => {
          set((state) => {
            // 히스토리 크기 제한
            if (state.executionHistory.length >= state.maxHistorySize) {
              state.executionHistory = state.executionHistory.slice(0, state.maxHistorySize - 1);
            }
            
            state.executionHistory.unshift(snapshot);
            
            // 성공한 실행만 롤백 스택에 추가
            if (snapshot.success) {
              state.rollbackStack.unshift(snapshot);
              
              // 롤백 스택 크기 제한
              if (state.rollbackStack.length > state.settings.maxRollbackSteps) {
                state.rollbackStack = state.rollbackStack.slice(0, state.settings.maxRollbackSteps);
              }
              
              state.canRollback = true;
            }
          });
        },

        clearExecutionHistory: () => {
          set((state) => {
            state.executionHistory = [];
            state.rollbackStack = [];
            state.canRollback = false;
          });
        },

        // 스냅샷 관리
        setCurrentSnapshot: (snapshot: SpreadsheetSnapshot | null) => {
          set((state) => {
            state.currentSnapshot = snapshot;
            
            if (snapshot) {
              state.snapshotCache.set(snapshot.id, snapshot);
            }
          });
        },

        addSnapshotToCache: (snapshot: SpreadsheetSnapshot) => {
          set((state) => {
            state.snapshotCache.set(snapshot.id, snapshot);
            
            // 캐시 크기 제한 (메모리 관리)
            if (state.snapshotCache.size > 200) {
              const oldestKey = state.snapshotCache.keys().next().value;
              if (oldestKey) {
                state.snapshotCache.delete(oldestKey);
              }
            }
          });
        },

        getSnapshotFromCache: (id: string) => {
          return get().snapshotCache.get(id);
        },

        clearSnapshotCache: () => {
          set((state) => {
            state.snapshotCache.clear();
          });
        },

        // 롤백 관리
        addToRollbackStack: (snapshot: ExecutionSnapshot) => {
          set((state) => {
            if (state.rollbackStack.length >= state.settings.maxRollbackSteps) {
              state.rollbackStack.pop();
            }
            
            state.rollbackStack.unshift(snapshot);
            state.canRollback = state.rollbackStack.length > 0;
          });
        },

        removeFromRollbackStack: (count = 1) => {
          const state = get();
          const removed = state.rollbackStack.splice(0, count);
          
          set((state) => {
            state.canRollback = state.rollbackStack.length > 0;
          });
          
          return removed;
        },

        canPerformRollback: () => {
          const state = get();
          return state.canRollback && state.rollbackStack.length > 0 && !state.isExecuting;
        },

        clearRollbackStack: () => {
          set((state) => {
            state.rollbackStack = [];
            state.canRollback = false;
          });
        },

        // 자동저장 관리
        setAutosavePending: (pending: boolean, changesCount = 0) => {
          set((state) => {
            state.autosave.isPending = pending;
            if (pending) {
              state.autosave.queuedChanges += changesCount;
            } else {
              state.autosave.queuedChanges = 0;
            }
          });
        },

        setAutosaveInProgress: (inProgress: boolean) => {
          set((state) => {
            state.autosave.isInProgress = inProgress;
          });
        },

        setLastSavedAt: (timestamp: string) => {
          set((state) => {
            state.autosave.lastSavedAt = timestamp;
            state.autosave.isPending = false;
            state.autosave.queuedChanges = 0;
            state.autosave.error = null;
          });
        },

        setNextSaveAt: (timestamp: string | null) => {
          set((state) => {
            state.autosave.nextSaveAt = timestamp;
          });
        },

        incrementSaveCount: () => {
          set((state) => {
            state.autosave.saveCount += 1;
          });
        },

        setAutosaveError: (error: string | null) => {
          set((state) => {
            state.autosave.error = error;
            if (error) {
              state.autosave.isInProgress = false;
            }
          });
        },

        resetAutosaveState: () => {
          set((state) => {
            state.autosave = {
              ...initialState.autosave,
              saveCount: state.autosave.saveCount, // 저장 횟수는 유지
            };
          });
        },

        // 설정 관리
        updateSettings: (newSettings) => {
          set((state) => {
            state.settings = { ...state.settings, ...newSettings };
          });
        },

        // 유틸리티
        getExecutionHistoryByRange: (range: string) => {
          const state = get();
          return state.executionHistory.filter(
            execution => execution.targetRange === range
          );
        },

        getLastNExecutions: (count: number) => {
          const state = get();
          return state.executionHistory.slice(0, count);
        },

        getExecutionById: (id: string) => {
          const state = get();
          return state.executionHistory.find(execution => execution.id === id);
        },

        // 전체 상태 리셋
        resetStore: () => {
          set(() => ({
            ...initialState,
            snapshotCache: new Map(), // Map 객체는 새로 생성
          }));
        },
      })),
      {
        name: 'spreadjs-command-store',
        // 민감한 데이터는 persist에서 제외
        partialize: (state) => ({
          settings: state.settings,
          autosave: {
            ...state.autosave,
            isPending: false,
            isInProgress: false,
            error: null,
          },
          maxHistorySize: state.maxHistorySize,
        }),
      }
    ),
    {
      name: 'SpreadJS Command Store',
    }
  )
);

// 타입 export
export type {
  SpreadsheetSnapshot,
  ExecutionSnapshot,
  AutosaveState,
  RollbackOptions,
  SpreadjsCommandStoreState,
  SpreadjsCommandStoreActions,
};

// 유틸리티 함수 export
export { generateChecksum };
