import React, { createContext, useContext, useState } from 'react';

// Context 타입 정의
interface FileStateContextType {
  sourceFile: File | null;
  targetFile: File | null;
  setSourceFile: (file: File | null) => void;
  setTargetFile: (file: File | null) => void;
}

// Context 생성
const FileStateContext = createContext<FileStateContextType | null>(null);

// Provider Props 타입
interface FileStateProviderProps {
  children: React.ReactNode;
}

// Provider 컴포넌트
export const FileStateProvider: React.FC<FileStateProviderProps> = ({ children }) => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);

  const contextValue: FileStateContextType = {
    sourceFile,
    targetFile,
    setSourceFile,
    setTargetFile,
  };

  return (
    <FileStateContext.Provider value={contextValue}>
      {children}
    </FileStateContext.Provider>
  );
};

// Context 사용 Hook
export const useFileState = (): FileStateContextType => {
  const context = useContext(FileStateContext);

  if (!context) {
    throw new Error('useFileState must be used within a FileStateProvider');
  }

  return context;
};
