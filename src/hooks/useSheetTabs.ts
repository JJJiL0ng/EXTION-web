'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUnifiedStore } from '@/stores';
import { XLSXData, SheetData } from '@/stores/store-types';

export const useSheetTabs = (xlsxData: any) => {
  const { setXLSXData, switchToSheet } = useUnifiedStore();
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isCreateSheetModalOpen, setIsCreateSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  
  // 스크롤바 관련 상태
  const [scrollThumbPosition, setScrollThumbPosition] = useState(0);
  const [scrollThumbWidth, setScrollThumbWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  // 새 시트 생성 핸들러
  const handleCreateSheet = () => {
    if (!newSheetName.trim()) return;

    // 기본 빈 데이터로 새 시트 생성
    const emptyData = Array(20).fill(Array(6).fill(''));

    if (xlsxData) {
      // 기존 xlsxData가 있는 경우 새 시트 추가
      // 중복되는 시트명 확인
      const existingNames = xlsxData.sheets.map((s: any) => s.sheetName);
      let uniqueName = newSheetName;
      let counter = 1;

      while (existingNames.includes(uniqueName)) {
        uniqueName = `${newSheetName} ${counter}`;
        counter++;
      }

      // 새 시트 데이터 생성
      const newSheet: SheetData = {
        sheetName: uniqueName,
        rawData: emptyData,
        metadata: {
          rowCount: emptyData.length,
          columnCount: emptyData[0]?.length || 0,
          dataRange: {
            startRow: 0,
            endRow: emptyData.length - 1,
            startCol: 0,
            endCol: (emptyData[0]?.length || 1) - 1,
            startColLetter: 'A',
            endColLetter: String.fromCharCode(65 + (emptyData[0]?.length || 1) - 1)
          },
          lastModified: new Date()
        }
      };

      // 새 xlsxData 생성하여 적용
      const newXlsxData = { ...xlsxData };
      newXlsxData.sheets = [...newXlsxData.sheets, newSheet];
      const newSheetIndex = newXlsxData.sheets.length - 1;

      // 상태 업데이트
      setXLSXData(newXlsxData);

      // 새 시트로 전환
      setTimeout(() => {
        try {
          switchToSheet(newSheetIndex);
        } catch (error) {
          console.warn('시트 전환 중 오류 (무시됨):', error);
        }
      }, 100);
    } else {
      // xlsxData가 없는 경우 새로 생성
      const newXlsxData: XLSXData = {
        fileName: 'new_spreadsheet.xlsx',
        sheets: [
          {
            sheetName: newSheetName,
            rawData: emptyData,
            metadata: {
              rowCount: emptyData.length,
              columnCount: emptyData[0]?.length || 0,
              dataRange: {
                startRow: 0,
                endRow: emptyData.length - 1,
                startCol: 0,
                endCol: (emptyData[0]?.length || 1) - 1,
                startColLetter: 'A',
                endColLetter: 'F'
              }
            }
          }
        ],
        activeSheetIndex: 0
      };

      setXLSXData(newXlsxData);
    }

    // 모달 상태 초기화
    setNewSheetName('');
    setIsCreateSheetModalOpen(false);
  };

  // 모달 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const modalElement = document.querySelector('.sheet-create-modal');
      const addButton = document.querySelector('.sheet-add-button');

      if (
        isCreateSheetModalOpen &&
        modalElement &&
        !modalElement.contains(target) &&
        addButton &&
        !addButton.contains(target)
      ) {
        setIsCreateSheetModalOpen(false);
        setNewSheetName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreateSheetModalOpen]);

  // 스크롤바 관련 이벤트 핸들러
  useEffect(() => {
    const checkScroll = () => {
      const container = tabsContainerRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      const hasHorizontalScroll = scrollWidth > clientWidth;

      // 스크롤바 표시 여부 설정
      setShowScrollbar(hasHorizontalScroll);

      // 스크롤바 thumb 위치와 너비 계산
      if (hasHorizontalScroll) {
        const thumbWidth = Math.max(30, (clientWidth / scrollWidth) * clientWidth);
        setScrollThumbWidth(thumbWidth);

        const maxScrollPosition = scrollWidth - clientWidth;
        const scrollPercentage = maxScrollPosition > 0 ? scrollLeft / maxScrollPosition : 0;
        const maxThumbPosition = clientWidth - thumbWidth;
        const thumbPosition = scrollPercentage * maxThumbPosition;

        setScrollThumbPosition(thumbPosition);
      }
    };

    // 초기 체크
    checkScroll();

    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [xlsxData?.sheets.length]);

  // 가상 스크롤바 클릭 핸들러
  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const scrollbarElement = e.currentTarget;
    const rect = scrollbarElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    // 클릭한 위치로 thumb 이동
    const scrollPercentage = clickX / rect.width;
    const scrollPosition = scrollPercentage * (container.scrollWidth - container.clientWidth);

    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  };

  // 드래그 시작 핸들러
  const handleThumbDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);

    const container = tabsContainerRef.current;
    if (container) {
      setDragStartScroll(container.scrollLeft);
    }

    // 글로벌 이벤트 리스너 추가
    document.addEventListener('mousemove', handleThumbDrag);
    document.addEventListener('mouseup', handleThumbDragEnd);
  };

  // 드래그 중 핸들러
  const handleThumbDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const container = tabsContainerRef.current;
    if (!container) return;

    const deltaX = e.clientX - dragStartX;
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;

    const maxScrollPosition = scrollWidth - containerWidth;
    const dragRatio = containerWidth / scrollWidth;
    const scrollDelta = deltaX / dragRatio;

    container.scrollLeft = Math.max(0, Math.min(maxScrollPosition, dragStartScroll + scrollDelta));
  }, [isDragging, dragStartX, dragStartScroll]);

  // 드래그 종료 핸들러
  const handleThumbDragEnd = useCallback(() => {
    setIsDragging(false);

    // 글로벌 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleThumbDrag);
    document.removeEventListener('mouseup', handleThumbDragEnd);
  }, [handleThumbDrag]);

  // 스크롤 이벤트 핸들러 등록 및 해제
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbDragEnd);
    };
  }, [handleThumbDrag, handleThumbDragEnd]);

  return {
    tabsContainerRef,
    isCreateSheetModalOpen,
    newSheetName,
    showScrollbar,
    scrollThumbPosition,
    scrollThumbWidth,
    isDragging,
    setIsCreateSheetModalOpen,
    setNewSheetName,
    handleCreateSheet,
    handleScrollbarClick,
    handleThumbDragStart,
  };
}; 