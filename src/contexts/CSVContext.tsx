// // contexts/CSVContext.tsx
// 'use client'

// import React, { createContext, useContext, useState, ReactNode } from 'react';

// interface CSVData {
//   headers: string[];
//   data: string[][];
//   fileName: string;
// }

// interface CSVContextType {
//   csvData: CSVData | null;
//   setCsvData: (data: CSVData | null) => void;
//   isLoading: boolean;
//   setIsLoading: (loading: boolean) => void;
// }

// const CSVContext = createContext<CSVContextType | undefined>(undefined);

// export const CSVProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [csvData, setCsvData] = useState<CSVData | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   return (
//     <CSVContext.Provider value={{ csvData, setCsvData, isLoading, setIsLoading }}>
//       {children}
//     </CSVContext.Provider>
//   );
// };

// export const useCSV = () => {
//   const context = useContext(CSVContext);
//   if (context === undefined) {
//     throw new Error('useCSV must be used within a CSVProvider');
//   }
//   return context;
// };