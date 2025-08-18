import React, { createContext, useContext, MutableRefObject, useEffect, useState } from 'react';
import { UseSpreadjsCommandStoreReturn } from '@/_hooks/sheet/useSpreadjsCommandStore';
import { FormulaResponse } from '@/_hooks/sheet/useSpreadjsCommandEngine';

// Context 타입 정의
interface SpreadsheetContextType {
  spreadRef: MutableRefObject<any> | null;
  commandManager: UseSpreadjsCommandStoreReturn | null;
  executeFormula: (formulaResponse: FormulaResponse) => Promise<void>;
  isReady: boolean;
}

// Context 생성
const SpreadsheetContext = createContext<SpreadsheetContextType | null>(null);

// Provider Props 타입
interface SpreadsheetProviderProps {
  children: React.ReactNode;
  spreadRef: MutableRefObject<any>;
  commandManager: UseSpreadjsCommandStoreReturn;
}

// Provider 컴포넌트
export const SpreadsheetProvider: React.FC<SpreadsheetProviderProps> = ({
  children,
  spreadRef,
  commandManager //spreadjs formula excute engine
}) => {
  // SpreadJS 인스턴스 준비 상태를 실시간으로 추적
  const [isSpreadReady, setIsSpreadReady] = useState(false);

  // SpreadJS 인스턴스 변화 감지
  useEffect(() => {
    const checkSpreadReady = () => {
      const ready = !!(spreadRef?.current && commandManager);
      setIsSpreadReady(ready);
      if (ready) {
        console.log('✅ SpreadsheetContext Ready:', { 
          hasSpreadRef: !!spreadRef?.current, 
          hasCommandManager: !!commandManager 
        });
      }
    };

    // 초기 체크
    checkSpreadReady();

    // SpreadJS 인스턴스가 설정될 때까지 주기적으로 체크
    const interval = setInterval(checkSpreadReady, 100);

    // 준비되면 interval 제거
    if (isSpreadReady) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [spreadRef, commandManager, isSpreadReady]);

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

  const contextValue: SpreadsheetContextType = {
    spreadRef,
    commandManager,
    executeFormula,
    isReady: isSpreadReady
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