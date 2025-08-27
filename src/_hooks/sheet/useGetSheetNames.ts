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

    console.log(`현재 시트들의 이름: ${sheetNames}`);
    return sheetNames;
  }, [spreadRef]);

  return { getSheetNames };
};