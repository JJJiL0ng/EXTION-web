import { useCallback } from 'react';

interface UseGetSheetNamesProps {
  spreadRef: React.RefObject<any>;
}

export const useGetSheetNames = ({ spreadRef }: UseGetSheetNamesProps) => {
  const getSheetNames = useCallback(() => {
    if (!spreadRef.current) {
      console.log('SpreadRef is not available');
      return [];
    }

    var sheetCount = spreadRef.current.getSheetCount();
    var sheetNames = [];

    for (var i = 0; i < sheetCount; i++) {
      var sheet = spreadRef.current.getSheet(i);
      sheetNames.push(sheet.name());
    }
    
    console.log(sheetNames);
    return sheetNames;
  }, [spreadRef]);

  return { getSheetNames };
};