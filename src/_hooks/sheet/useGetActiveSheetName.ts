import { useCallback } from 'react';

interface UseGetSheetNamesProps {
  spreadRef: React.RefObject<any> | React.MutableRefObject<any> | null;
}

export const useGetActiveSheetName = ({ spreadRef }: UseGetSheetNamesProps) => {
  const getActiveSheetName = useCallback(() => {
    if (!spreadRef?.current) {
      console.log('SpreadRef is not available');
      return '';
    }
    var activeSheetName = spreadRef.current.getActiveSheet().name();

    console.log(activeSheetName);
    return activeSheetName;
  }, [spreadRef]);

  return { getActiveSheetName };
};
