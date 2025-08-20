"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import * as GC from "@mescius/spread-sheets";
import { SheetAPI, ApplyDeltaRequest } from '@/_Api/sheet/sheetApi';
import { useSpreadjsCommandStore } from '@/_store/sheet/spreadjsCommandStore';
import { useSpreadSheetDeltaApply } from './useSpreadSheetDeltaApply';
import { 
  CellDelta, 
  DeltaAction, 
  DeltaState, 
  DeltaBatch, 
  CellStyle 
} from '@/_types/delta';

interface UseSpreadSheetDeltaConfig {
  userId: string;
  spreadsheetId?: string;
  batchTimeout?: number;
  maxRetries?: number;
  maxBatchSize?: number;
  onDeltaApplied?: (delta: CellDelta) => void;
  onError?: (error: Error, context?: any) => void;
  onSync?: (syncedDeltas: number) => void;
}

interface UseSpreadSheetDeltaReturn {
  state: DeltaState;
  queueDelta: (delta: CellDelta) => void;
  applyServerDelta: (delta: CellDelta) => void;
  forcSync: () => Promise<void>;
  clearFailedDeltas: () => void;
  retryFailedDeltas: () => Promise<void>;
  setupEventListeners: (spreadjs: any) => () => void;
  convertToAddress: (row: number, col: number) => string;
  parseAddress: (address: string) => { row: number; col: number };
}

export const useSpreadSheetDelta = (
  config: UseSpreadSheetDeltaConfig
): UseSpreadSheetDeltaReturn => {
  const {
    userId: _userId, // 현재 사용하지 않지만 향후 사용 예정
    spreadsheetId: _spreadsheetId, // 현재 사용하지 않지만 향후 사용 예정
    batchTimeout = 500,
    maxRetries = 3,
    maxBatchSize = 50,
    onDeltaApplied,
    onError,
    onSync
  } = config;

  // 상태 관리
  const [state, setState] = useState<DeltaState>({
    isPending: false,
    isProcessing: false,
    lastSyncAt: null,
    queuedDeltas: 0,
    failedDeltas: [],
    error: null
  });

  // 내부 상태
  const pendingDeltas = useRef<CellDelta[]>([]);
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingServerDelta = useRef(false);
  const retryBatches = useRef<Map<string, DeltaBatch>>(new Map());
  const spreadjsRef = useRef<any>(null);
  
  // 자동저장 스토어 연동
  const { 
    setAutosavePending, 
    setAutosaveInProgress, 
    setLastSavedAt, 
    setAutosaveError 
  } = useSpreadjsCommandStore();

  // 델타 적용 유틸리티
  const { applyDeltaToSpreadJS } = useSpreadSheetDeltaApply();

  // 델타를 큐에 추가
  const queueDelta = useCallback((delta: CellDelta) => {
    if (isApplyingServerDelta.current) {
      return; // 서버 델타 적용 중에는 무시
    }

    pendingDeltas.current.push(delta);
    
    setState(prev => ({
      ...prev,
      isPending: true,
      queuedDeltas: pendingDeltas.current.length,
      error: null
    }));

    setAutosavePending(true, 1);
    
    // 배치 타이머 설정
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }
    
    batchTimer.current = setTimeout(async () => {
      await sendBatchDeltas();
    }, batchTimeout);

    // 최대 배치 크기에 도달하면 즉시 전송
    if (pendingDeltas.current.length >= maxBatchSize) {
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }
      sendBatchDeltas().catch(console.error);
    }
  }, [batchTimeout, maxBatchSize, setAutosavePending]);

  // 배치 델타 전송
  const sendBatchDeltas = useCallback(async () => {
    if (pendingDeltas.current.length === 0) return;

    const deltasToSend = [...pendingDeltas.current];
    pendingDeltas.current = [];

    setState(prev => ({
      ...prev,
      isProcessing: true,
      queuedDeltas: 0
    }));

    setAutosaveInProgress(true);

    // 목업 모드 - 개발 환경에서 서버 없이 테스트
    if (process.env.NEXT_PUBLIC_DELTA_MOCK_MODE === 'true') {
      console.log('🔄 [목업 모드] 델타 전송 시뮬레이션:', deltasToSend);
      
      // 성공 시뮬레이션
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isPending: false,
          isProcessing: false,
          lastSyncAt: new Date().toISOString(),
          error: null
        }));

        setLastSavedAt(new Date().toISOString());
        setAutosaveInProgress(false);
        
        onSync?.(deltasToSend.length);
        
        deltasToSend.forEach(delta => {
          onDeltaApplied?.(delta);
        });
        
        console.log('✅ [목업 모드] 델타 동기화 완료:', deltasToSend.length);
      }, 100 + Math.random() * 200); // 100-300ms 시뮬레이션
      
      return;
    }

    try {
      // SpreadJS 델타를 API 델타로 변환
      const apiDeltas: ApplyDeltaRequest[] = deltasToSend.map(delta => ({
        action: delta.action,
        sheetName: delta.sheetName,
        cellAddress: delta.cellAddress,
        range: delta.range,
        value: delta.value,
        formula: delta.formula,
        style: delta.style,
        rowIndex: delta.rowIndex,
        columnIndex: delta.columnIndex,
        count: delta.count
      }));

      const response = await SheetAPI.applyBatchDeltas({
        deltas: apiDeltas
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          isPending: false,
          isProcessing: false,
          lastSyncAt: new Date().toISOString(),
          error: null
        }));

        setLastSavedAt(new Date().toISOString());
        setAutosaveInProgress(false);
        
        onSync?.(response.data.appliedCount);
        
        // 각 델타에 대해 콜백 실행
        deltasToSend.forEach(delta => {
          onDeltaApplied?.(delta);
        });
      } else {
        throw new Error(response.message || 'Delta application failed');
      }
    } catch (error) {
      console.error('배치 델타 전송 실패:', error);
      
      // 서버 오류(500)인 경우 재시도하지 않음
      const isServerError = error instanceof Error && 
        (error.message.includes('500') || error.message.includes('Internal Server Error'));
      
      if (isServerError) {
        console.warn('🚫 서버 오류로 인해 델타 동기화를 중단합니다. 백엔드 서버를 확인해주세요.');
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: '서버 오류로 인해 자동저장을 사용할 수 없습니다.'
        }));
        setAutosaveError('백엔드 서버 오류로 인해 자동저장이 비활성화되었습니다.');
        onError?.(error instanceof Error ? error : new Error('Server error'), { deltasToSend, serverError: true });
        return;
      }

      // 네트워크 오류나 기타 오류인 경우만 재시도
      const batchId = Date.now().toString();
      retryBatches.current.set(batchId, {
        deltas: deltasToSend,
        createdAt: Date.now(),
        retryCount: 0
      });

      setState(prev => ({
        ...prev,
        isProcessing: false,
        failedDeltas: [...prev.failedDeltas, ...deltasToSend],
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      setAutosaveError(error instanceof Error ? error.message : 'Delta sync failed');
      onError?.(error instanceof Error ? error : new Error('Unknown error'), { deltasToSend });
      
      // 자동 재시도 (지수 백오프) - 서버 오류가 아닌 경우만
      setTimeout(() => {
        retryBatch(batchId);
      }, Math.min(1000 * Math.pow(2, 0), 30000));
    }
  }, [onSync, onDeltaApplied, onError, setAutosaveInProgress, setLastSavedAt, setAutosaveError]);

  // 개별 배치 재시도
  const retryBatch = useCallback(async (batchId: string) => {
    const batch = retryBatches.current.get(batchId);
    if (!batch || batch.retryCount >= maxRetries) {
      retryBatches.current.delete(batchId);
      return;
    }

    batch.retryCount++;
    
    try {
      const apiDeltas: ApplyDeltaRequest[] = batch.deltas.map(delta => ({
        action: delta.action,
        sheetName: delta.sheetName,
        cellAddress: delta.cellAddress,
        range: delta.range,
        value: delta.value,
        formula: delta.formula,
        style: delta.style,
        rowIndex: delta.rowIndex,
        columnIndex: delta.columnIndex,
        count: delta.count
      }));

      const response = await SheetAPI.applyBatchDeltas({
        deltas: apiDeltas
      });

      if (response.success) {
        // 성공 시 실패 목록에서 제거
        setState(prev => ({
          ...prev,
          failedDeltas: prev.failedDeltas.filter(
            delta => !batch.deltas.includes(delta)
          ),
          error: null
        }));
        
        retryBatches.current.delete(batchId);
        onSync?.(response.data.appliedCount);
      } else {
        throw new Error(response.message || 'Retry failed');
      }
    } catch (error) {
      // 재시도 실패 시 다시 스케줄링
      if (batch.retryCount < maxRetries) {
        setTimeout(() => {
          retryBatch(batchId);
        }, Math.min(1000 * Math.pow(2, batch.retryCount), 30000));
      } else {
        retryBatches.current.delete(batchId);
        console.error('배치 최대 재시도 횟수 도달:', batchId);
      }
    }
  }, [maxRetries, onSync]);

  // 서버에서 받은 델타 적용
  const applyServerDelta = useCallback((delta: CellDelta) => {
    if (!spreadjsRef.current) {
      console.warn('SpreadJS 인스턴스가 설정되지 않아 서버 델타를 적용할 수 없습니다.');
      return;
    }

    try {
      applyDeltaToSpreadJS(spreadjsRef.current, delta, isApplyingServerDelta);
      console.log('✅ 서버 델타 적용 완료:', delta);
      onDeltaApplied?.(delta);
    } catch (error) {
      console.error('❌ 서버 델타 적용 실패:', error, delta);
      onError?.(error instanceof Error ? error : new Error('Server delta apply failed'), { delta });
    }
  }, [applyDeltaToSpreadJS, onDeltaApplied, onError]);

  // 강제 동기화
  const forcSync = useCallback(async () => {
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }
    await sendBatchDeltas();
  }, [sendBatchDeltas]);

  // 실패한 델타 목록 초기화
  const clearFailedDeltas = useCallback(() => {
    setState(prev => ({
      ...prev,
      failedDeltas: [],
      error: null
    }));
    retryBatches.current.clear();
  }, []);

  // 실패한 델타들 재시도
  const retryFailedDeltas = useCallback(async () => {
    const failedDeltas = [...state.failedDeltas];
    if (failedDeltas.length === 0) return;

    setState(prev => ({
      ...prev,
      failedDeltas: [],
      isProcessing: true
    }));

    try {
      const apiDeltas: ApplyDeltaRequest[] = failedDeltas.map(delta => ({
        action: delta.action,
        sheetName: delta.sheetName,
        cellAddress: delta.cellAddress,
        range: delta.range,
        value: delta.value,
        formula: delta.formula,
        style: delta.style,
        rowIndex: delta.rowIndex,
        columnIndex: delta.columnIndex,
        count: delta.count
      }));

      const response = await SheetAPI.applyBatchDeltas({
        deltas: apiDeltas
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: null,
          lastSyncAt: new Date().toISOString()
        }));
        onSync?.(response.data.appliedCount);
      } else {
        throw new Error(response.message || 'Retry failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        failedDeltas: failedDeltas,
        error: error instanceof Error ? error.message : 'Retry failed'
      }));
      onError?.(error instanceof Error ? error : new Error('Retry failed'));
    }
  }, [state.failedDeltas, onSync, onError]);

  // 좌표 변환 유틸리티 함수들
  const convertToAddress = useCallback((row: number, col: number): string => {
    const columnName = numberToColumn(col);
    return `${columnName}${row + 1}`;
  }, []);

  const parseAddress = useCallback((address: string): { row: number; col: number } => {
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Invalid address: ${address}`);
    
    const col = columnToNumber(match[1]);
    const row = parseInt(match[2]) - 1;
    
    return { row, col };
  }, []);

  // SpreadJS 이벤트 리스너 설정
  const setupEventListeners = useCallback((spreadjs: any) => {
    if (!spreadjs) return () => {};

    // SpreadJS 인스턴스 저장
    spreadjsRef.current = spreadjs;

    const handleCellChanged = (_event: any, info: any) => {
      if (isApplyingServerDelta.current) return;

      const sheet = spreadjs.getActiveSheet();
      const sheetName = sheet.name();
      const { row, col, newValue } = info;
      
      const cellAddress = convertToAddress(row, col);
      const formula = sheet.getFormula(row, col);
      
      const delta: CellDelta = {
        action: formula ? DeltaAction.SET_CELL_FORMULA : DeltaAction.SET_CELL_VALUE,
        sheetName,
        cellAddress,
        value: formula ? undefined : newValue,
        formula: formula || undefined,
        timestamp: Date.now()
      };

      queueDelta(delta);
    };

    const handleStyleChanged = (_event: any, _info: any) => {
      if (isApplyingServerDelta.current) return;

      const sheet = spreadjs.getActiveSheet();
      const selection = sheet.getSelections()[0];
      
      if (!selection) return;
      
      const { row, col, rowCount, colCount } = selection;
      const style = sheet.getActualStyle(row, col);
      
      const cellAddress = rowCount === 1 && colCount === 1 
        ? convertToAddress(row, col)
        : undefined;
        
      const range = rowCount > 1 || colCount > 1
        ? `${convertToAddress(row, col)}:${convertToAddress(row + rowCount - 1, col + colCount - 1)}`
        : undefined;

      const delta: CellDelta = {
        action: DeltaAction.SET_CELL_STYLE,
        sheetName: sheet.name(),
        cellAddress,
        range,
        style: convertSpreadJSStyleToCellStyle(style),
        timestamp: Date.now()
      };

      queueDelta(delta);
    };

    const handleRowChanged = (_event: any, info: any) => {
      if (isApplyingServerDelta.current) return;

      const sheet = spreadjs.getActiveSheet();
      const sheetName = sheet.name();
      const { row, rowCount, action } = info;
      
      const delta: CellDelta = {
        action: action === 'insert' ? DeltaAction.INSERT_ROWS : DeltaAction.DELETE_ROWS,
        sheetName,
        rowIndex: row,
        count: rowCount,
        timestamp: Date.now()
      };

      queueDelta(delta);
    };

    const handleColumnChanged = (_event: any, info: any) => {
      if (isApplyingServerDelta.current) return;

      const sheet = spreadjs.getActiveSheet();
      const sheetName = sheet.name();
      const { col, colCount, action } = info;
      
      const delta: CellDelta = {
        action: action === 'insert' ? DeltaAction.INSERT_COLUMNS : DeltaAction.DELETE_COLUMNS,
        sheetName,
        columnIndex: col,
        count: colCount,
        timestamp: Date.now()
      };

      queueDelta(delta);
    };

    // 이벤트 리스너 등록
    spreadjs.bind(GC.Spread.Sheets.Events.CellChanged, handleCellChanged);
    spreadjs.bind(GC.Spread.Sheets.Events.CellClick, handleStyleChanged);
    spreadjs.bind(GC.Spread.Sheets.Events.RowChanged, handleRowChanged);
    spreadjs.bind(GC.Spread.Sheets.Events.ColumnChanged, handleColumnChanged);

    // 클린업 함수 반환
    return () => {
      spreadjs.unbind(GC.Spread.Sheets.Events.CellChanged, handleCellChanged);
      spreadjs.unbind(GC.Spread.Sheets.Events.CellClick, handleStyleChanged);
      spreadjs.unbind(GC.Spread.Sheets.Events.RowChanged, handleRowChanged);
      spreadjs.unbind(GC.Spread.Sheets.Events.ColumnChanged, handleColumnChanged);
    };
  }, [convertToAddress, queueDelta]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }
      // Map 인스턴스를 로컬 변수로 복사하여 사용
      const batches = retryBatches.current;
      batches.clear();
    };
  }, []);

  return {
    state,
    queueDelta,
    applyServerDelta,
    forcSync,
    clearFailedDeltas,
    retryFailedDeltas,
    setupEventListeners,
    convertToAddress,
    parseAddress
  };
};

// 유틸리티 함수들
function numberToColumn(num: number): string {
  let result = '';
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
}

function columnToNumber(column: string): number {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64);
  }
  return result - 1;
}

function convertSpreadJSStyleToCellStyle(spreadJSStyle: any): CellStyle {
  return {
    backgroundColor: spreadJSStyle.backColor,
    color: spreadJSStyle.foreColor,
    fontSize: spreadJSStyle.fontSize,
    fontFamily: spreadJSStyle.fontFamily,
    fontWeight: spreadJSStyle.fontWeight,
    textAlign: convertAlignment(spreadJSStyle.hAlign),
    verticalAlign: convertVerticalAlignment(spreadJSStyle.vAlign),
    // border 변환 로직은 필요에 따라 추가
  };
}

function convertAlignment(hAlign: number): 'left' | 'center' | 'right' | 'justify' {
  switch (hAlign) {
    case GC.Spread.Sheets.HorizontalAlign.center: return 'center';
    case GC.Spread.Sheets.HorizontalAlign.right: return 'right';
    case (GC.Spread.Sheets.HorizontalAlign as any).justify: return 'justify';
    default: return 'left';
  }
}

function convertVerticalAlignment(vAlign: number): 'top' | 'middle' | 'bottom' {
  switch (vAlign) {
    case GC.Spread.Sheets.VerticalAlign.center: return 'middle';
    case GC.Spread.Sheets.VerticalAlign.bottom: return 'bottom';
    default: return 'top';
  }
}