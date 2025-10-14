import React, { createContext, useContext, MutableRefObject, useEffect, useState, useRef } from 'react';

// Context 타입 정의
interface SpreadsheetContextType {
  // SpreadJS 인스턴스 자체를 보관 (ref가 아닌 instance)
  spread: any | null;
  // 인스턴스 준비 여부
  isReady: boolean;
}

// Context 생성
const SourceSheetContext = createContext<SpreadsheetContextType | null>(null);

// Provider Props 타입
interface SpreadsheetProviderProps {
  children: React.ReactNode;
  // 외부에서 관리하는 ref를 입력 받아 내부에서 instance로 노출
  spreadRef: MutableRefObject<any>;
}

// Provider 컴포넌트
export const SourceSheetProvider: React.FC<SpreadsheetProviderProps> = ({
  children,
  spreadRef
}) => {
  // SpreadJS 인스턴스를 보관 (ref가 아닌 instance)
  const [spread, setSpread] = useState<any | null>(null);
  const [isSpreadReady, setIsSpreadReady] = useState(false);
  const hasLoggedReady = useRef(false);

  // ref.current 변화를 폴링하여 instance 저장
  useEffect(() => {
    const check = () => {
      const instance = spreadRef?.current ?? null;
      setSpread((prev: any | null) => (prev !== instance ? instance : prev));
      const ready = !!instance;
      setIsSpreadReady(ready);
      if (ready && !hasLoggedReady.current) {
        console.log('✅ SourceSheetContext Ready (instance detected)');
        hasLoggedReady.current = true;
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
    <SourceSheetContext.Provider value={contextValue}>
      {children}
    </SourceSheetContext.Provider>
  );
};

// Context 사용 Hook
export const useSourceSheetContext = (): SpreadsheetContextType => {
  const context = useContext(SourceSheetContext);

  if (!context) {
    throw new Error('useSourceSheetContext must be used within a SourceSheetProvider');
  }
  
  return context;
};

// 안전한 Context 사용 Hook (null 허용)
export const useSourceSheetContextSafe = (): SpreadsheetContextType | null => {
  return useContext(SourceSheetContext);
};

export { SourceSheetContext };
export type { SpreadsheetContextType };