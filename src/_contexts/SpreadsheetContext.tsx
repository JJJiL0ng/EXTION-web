"use client";

import React, { createContext, useContext, RefObject } from 'react';
import { UseSpreadjsCommandStoreReturn } from '@/_hooks/sheet/useSpreadjsCommandStore';
import { FormulaResponse } from '@/_hooks/sheet/useSpreadjsCommandEngine';

// Context 타입 정의
interface SpreadsheetContextType {
  spreadRef: RefObject<any> | null;
  commandManager: UseSpreadjsCommandStoreReturn | null;
  executeFormula: (formulaResponse: FormulaResponse) => Promise<void>;
  isReady: boolean;
}

// Context 생성
const SpreadsheetContext = createContext<SpreadsheetContextType | null>(null);

// Provider Props 타입
interface SpreadsheetProviderProps {
  children: React.ReactNode;
  spreadRef: RefObject<any>;
  commandManager: UseSpreadjsCommandStoreReturn;
}

// Provider 컴포넌트
export const SpreadsheetProvider: React.FC<SpreadsheetProviderProps> = ({
  children,
  spreadRef,
  commandManager
}) => {
  // 수식 실행 통합 함수
  const executeFormula = async (formulaResponse: FormulaResponse): Promise<void> => {
    if (!spreadRef.current) {
      throw new Error('SpreadJS 인스턴스가 준비되지 않았습니다.');
    }

    if (!commandManager) {
      throw new Error('Command Manager가 초기화되지 않았습니다.');
    }

    try {
      await commandManager.executeCommand(formulaResponse);
    } catch (error) {
      console.error('수식 실행 실패:', error);
      throw error;
    }
  };

  // Context 준비 상태 확인
  const isReady = !!(spreadRef?.current && commandManager);

  const contextValue: SpreadsheetContextType = {
    spreadRef,
    commandManager,
    executeFormula,
    isReady
  };

  return (
    <SpreadsheetContext.Provider value={contextValue}>
      {children}
    </SpreadsheetContext.Provider>
  );
};

// Context 사용 Hook
export const useSpreadsheetContext = (): SpreadsheetContextType => {
  const context = useContext(SpreadsheetContext);
  
  if (!context) {
    throw new Error('useSpreadsheetContext must be used within a SpreadsheetProvider');
  }
  
  return context;
};

// 안전한 Context 사용 Hook (null 허용)
export const useSpreadsheetContextSafe = (): SpreadsheetContextType | null => {
  return useContext(SpreadsheetContext);
};

export { SpreadsheetContext };
export type { SpreadsheetContextType };