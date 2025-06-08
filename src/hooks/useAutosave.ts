import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useUnifiedStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { replaceSpreadsheet } from '@/services/api/dataServices';

// Debounce 함수: 지정된 시간 동안 함수 호출 지연
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
};

export const useAutosave = () => {
    const { 
        xlsxData, 
        currentSpreadsheetId, 
        saveStatus, 
        setSaveStatus,
        updateSheetIds 
    } = useUnifiedStore();
    
    // user 상태 변경으로 인한 불필요한 재실행 방지를 위해 getState 사용
    const { user } = useAuthStore.getState();
    
    // 최신 xlsxData를 참조하기 위해 ref 사용
    const xlsxDataRef = useRef(xlsxData);
    useEffect(() => {
        xlsxDataRef.current = xlsxData;
    }, [xlsxData]);

    // 디버깅 로그 추가: 훅이 렌더링될 때마다 상태를 로깅
    useEffect(() => {
        console.log('[Autosave] Hook rendered. States:', {
            saveStatus,
            currentSpreadsheetId,
            userId: user?.uid,
            hasXlsxData: !!xlsxDataRef.current,
        });
    });

    const saveChanges = useCallback(async () => {
        console.log('[Autosave] saveChanges triggered. Checking conditions with current state:', {
            saveStatus,
            currentSpreadsheetId,
            userId: user?.uid,
        });
        
        // 저장할 수 없는 조건이면 바로 리턴
        if (saveStatus !== 'modified' || !currentSpreadsheetId || !user?.uid || !xlsxDataRef.current) {
            console.warn('[Autosave] Save aborted due to unmet conditions.');
            return;
        }

        console.log('[Autosave] 자동 저장 시작...');
        setSaveStatus('saving');

        const dataToSave = {
            sheets: xlsxDataRef.current.sheets.map((sheet, index) => ({
                sheetName: sheet.sheetName,
                sheetIndex: index,
                data: sheet.rawData || [],
                // 백엔드에서 computedData, formulas 필드도 받을 수 있음
            })),
            description: `Auto-saved at ${new Date().toISOString()}`,
        };

        try {
            const result = await replaceSpreadsheet(currentSpreadsheetId, dataToSave, user.uid);
            if (result.success) {
                console.log('[Autosave] 자동 저장 성공:', result);
                setSaveStatus('synced');
                
                if (result.sheets) {
                    updateSheetIds(result.sheets.map(s => ({
                        sheetId: s.sheetId,
                        sheetIndex: s.sheetIndex,
                        sheetName: s.sheetName,
                        headers: [], // 응답에 headers 정보가 없으므로 빈 배열 전달
                        rowCount: s.rowCount,
                    })));
                }
            } else {
                console.error('[Autosave] 자동 저장 실패:', result.error || 'Unknown error');
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('[Autosave] 자동 저장 중 예외 발생:', error);
            setSaveStatus('error');
        }
    }, [currentSpreadsheetId, user, setSaveStatus, updateSheetIds, saveStatus]);
    
    // useMemo를 사용하여 디바운스 함수가 불필요하게 재생성되는 것을 방지
    const debouncedSaveChanges = useMemo(() => {
        console.log('[Autosave] Debounced function created/re-created.');
        return debounce(saveChanges, 2000)
    }, [saveChanges]);

    useEffect(() => {
        console.log(`[Autosave] useEffect for saveStatus dependency. Current status: "${saveStatus}"`);
        if (saveStatus === 'modified') {
            console.log('[Autosave] "modified" status detected. Calling debounced save function...');
            debouncedSaveChanges();
        }
    }, [saveStatus, debouncedSaveChanges]);
}; 