import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useUnifiedStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { queueAutoSave, getAutoSaveStatus, forceAutoSave, type AutoSaveSpreadsheetDto } from '@/services/api/dataServices';

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

    // Auto-Save 상태 체크 함수
    const checkAutoSaveStatus = useCallback(async () => {
        if (!currentSpreadsheetId || !user?.uid) return;

        try {
            const statusResponse = await getAutoSaveStatus(user.uid, currentSpreadsheetId);
            if (statusResponse.success && statusResponse.data.isQueued) {
                console.log('[Autosave] 큐에 대기 중:', statusResponse.data);
                setSaveStatus('saving');
            }
        } catch (error) {
            console.error('[Autosave] 상태 확인 오류:', error);
        }
    }, [currentSpreadsheetId, user?.uid, setSaveStatus]);

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

        console.log('[Autosave] 자동 저장 큐 추가 시작...');
        setSaveStatus('saving');

        // 백엔드 auto-save API에 맞는 데이터 형식으로 변환
        const autoSaveData: AutoSaveSpreadsheetDto = {
            userId: user.uid,
            spreadsheetId: currentSpreadsheetId,
            sheets: xlsxDataRef.current.sheets.map((sheet, index) => ({
                name: sheet.sheetName,
                index: index,
                data: sheet.rawData || [],
            })),
            activeSheetIndex: xlsxDataRef.current.activeSheetIndex || 0,
        };

        try {
            const result = await queueAutoSave(autoSaveData);
            if (result.success) {
                console.log('[Autosave] 자동 저장 큐 추가 성공:', result);
                
                // 큐에 추가된 후 실제 저장 완료까지 기다리기 위해 상태 모니터링
                await monitorSaveCompletion();
            } else {
                console.error('[Autosave] 자동 저장 큐 추가 실패:', result.message);
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('[Autosave] 자동 저장 큐 추가 중 예외 발생:', error);
            setSaveStatus('error');
        }
    }, [currentSpreadsheetId, user, setSaveStatus, saveStatus]);

    // 저장 완료까지 모니터링하는 함수
    const monitorSaveCompletion = useCallback(async () => {
        if (!currentSpreadsheetId || !user?.uid) return;

        // 최대 10초간 상태 체크 (2초마다)
        let attempts = 0;
        const maxAttempts = 5;
        
        const checkStatus = async (): Promise<void> => {
            try {
                const statusResponse = await getAutoSaveStatus(user.uid, currentSpreadsheetId);
                
                if (statusResponse.success) {
                    if (statusResponse.data.isQueued) {
                        // 아직 큐에 있음 - 계속 대기
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(checkStatus, 2000); // 2초 후 재시도
                        } else {
                            // 타임아웃 - 강제 저장 시도
                            console.warn('[Autosave] 저장 타임아웃, 강제 저장 시도...');
                            await forceAutoSave(user.uid, currentSpreadsheetId);
                            setSaveStatus('synced');
                        }
                    } else {
                        // 큐에서 제거됨 - 저장 완료
                        console.log('[Autosave] 자동 저장 완료 확인됨');
                        setSaveStatus('synced');
                    }
                }
            } catch (error) {
                console.error('[Autosave] 저장 상태 모니터링 오류:', error);
                setSaveStatus('error');
            }
        };

        // 첫 번째 상태 체크는 3초 후 (백엔드 AUTO_SAVE_DELAY)
        setTimeout(checkStatus, 3000);
    }, [currentSpreadsheetId, user?.uid, setSaveStatus]);
    
    // useMemo를 사용하여 디바운스 함수가 불필요하게 재생성되는 것을 방지
    const debouncedSaveChanges = useMemo(() => {
        console.log('[Autosave] Debounced function created/re-created.');
        return debounce(saveChanges, 1000) // 1초로 단축 (백엔드에서 3초 지연이 있으므로)
    }, [saveChanges]);

    useEffect(() => {
        console.log(`[Autosave] useEffect for saveStatus dependency. Current status: "${saveStatus}"`);
        if (saveStatus === 'modified') {
            console.log('[Autosave] "modified" status detected. Calling debounced save function...');
            debouncedSaveChanges();
        }
    }, [saveStatus, debouncedSaveChanges]);

    // 컴포넌트 마운트 시 자동 저장 상태 체크
    useEffect(() => {
        if (currentSpreadsheetId && user?.uid) {
            checkAutoSaveStatus();
        }
    }, [currentSpreadsheetId, user?.uid, checkAutoSaveStatus]);
}; 