'use client'

import { useState, useCallback, useEffect } from 'react';
import { HotTableRef } from '@handsontable/react-wrapper';
import { SelectedCellInfo } from '@/types/spreadsheet';

export const useCellEditor = (
  selectedCellInfo: SelectedCellInfo | null,
  hotRef: React.RefObject<HotTableRef>
) => {
  // 셀 편집을 위한 상태
  const [cellEditValue, setCellEditValue] = useState('');
  const [isCellEditing, setIsCellEditing] = useState(false);

  // 셀 편집 관련 핸들러들
  const handleCellEditChange = useCallback((value: string) => {
    setCellEditValue(value);
  }, []);

  const handleCellEditSubmit = useCallback(() => {
    if (!selectedCellInfo || !hotRef.current?.hotInstance) return;

    const hot = hotRef.current.hotInstance;

    try {
      // 헤더가 없으므로 그대로 사용
      const actualRow = selectedCellInfo.row; // +1 제거
      hot.setDataAtCell(actualRow, selectedCellInfo.col, cellEditValue);

      setIsCellEditing(false);

      setTimeout(() => {
        hot.render();
      }, 100);
    } catch (error) {
      console.error('Error updating cell:', error);
    }
  }, [selectedCellInfo, cellEditValue, hotRef]);

  const handleCellEditCancel = useCallback(() => {
    // 원래 값으로 복원
    if (selectedCellInfo) {
      setCellEditValue(selectedCellInfo.formula || selectedCellInfo.value?.toString() || '');
    }
    setIsCellEditing(false);
  }, [selectedCellInfo]);

  const handleCellEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellEditSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellEditCancel();
    }
  }, [handleCellEditSubmit, handleCellEditCancel]);

  // 셀 선택이 변경될 때 편집 값 업데이트
  useEffect(() => {
    if (selectedCellInfo) {
      setCellEditValue(selectedCellInfo.formula || selectedCellInfo.value?.toString() || '');
      setIsCellEditing(false);
    }
  }, [selectedCellInfo]);

  return {
    cellEditValue,
    isCellEditing,
    setCellEditValue,  // 외부에서도 직접 설정할 수 있도록
    setIsCellEditing,  // 외부에서도 직접 설정할 수 있도록
    handleCellEditChange,
    handleCellEditSubmit,
    handleCellEditCancel,
    handleCellEditKeyDown,
  };
}; 