import React, { createContext, useContext, MutableRefObject, useEffect, useState } from 'react';

// Context 타입 정의
interface SpreadsheetContextType {
  // SpreadJS 인스턴스 자체를 보관 (ref가 아닌 instance)
  spread: any | null;
  // 인스턴스 준비 여부
  isReady: boolean;
}

// Context 생성
const SpreadsheetContext = createContext<SpreadsheetContextType | null>(null);

// Provider Props 타입
interface SpreadsheetProviderProps {
  children: React.ReactNode;
  // 외부에서 관리하는 ref를 입력 받아 내부에서 instance로 노출
  spreadRef: MutableRefObject<any>;
}

// Provider 컴포넌트
export const SpreadsheetProvider: React.FC<SpreadsheetProviderProps> = ({
  children,
  spreadRef
}) => {
  // SpreadJS 인스턴스를 보관 (ref가 아닌 instance)
  const [spread, setSpread] = useState<any | null>(null);
  const [isSpreadReady, setIsSpreadReady] = useState(false);

  // ref.current 변화를 폴링하여 instance 저장
  useEffect(() => {
    const check = () => {
      const instance = spreadRef?.current ?? null;
      setSpread((prev: any | null) => (prev !== instance ? instance : prev));
      const ready = !!instance;
      setIsSpreadReady(ready);
      if (ready) {
        console.log('✅ SpreadsheetContext Ready (instance detected)');
      }
    };

    // 초기 체크 및 폴링 시작
    check();
    const interval = setInterval(check, 100);
    
    return () => clearInterval(interval);
  }, [spreadRef]); // isSpreadReady 의존성 제거 - 폴링 중단 방지

  const contextValue: SpreadsheetContextType = {
    spread,
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