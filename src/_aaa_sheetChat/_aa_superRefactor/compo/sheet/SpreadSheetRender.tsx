"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import { SpreadSheets } from "@mescius/spread-sheets-react";
import { useCheckAndLoadOnMount } from "@/_aaa_sheetChat/_hooks/sheet/data_save/useCheckAndLoad";
import { useSpreadSheetVersionStore } from '@/_aaa_sheetChat/_store/sheet/spreadSheetVersionIdStore';

import * as GC from "@mescius/spread-sheets";
import { configureSpreadRuntime } from '@/shared/spreadjs/spreadRuntime';

configureSpreadRuntime();

interface SpreadSheetProps {
    sheetWidthNum: number; // refresh 트리거용으로 유지
    spreadRef: React.MutableRefObject<any>; // Context가 폴링하는 ref
    spreadSheetId: string;
    chatId: string;
    userId: string;
}

export default function SpreadSheet({
    sheetWidthNum,
    spreadRef,
    spreadSheetId,
    chatId,
    userId,
}: SpreadSheetProps) {
    // FormulaBar 상태 관리
    const [cellAddress, setCellAddress] = useState('A1');
    const [cellValue, setCellValue] = useState('');

    // ID들을 안정화하여 불필요한 훅 재실행 방지
    const stableSpreadsheetId = useMemo(() => {
        console.log(`🔧 [FileUploadSheetRender] SpreadSheet ID 안정화: ${spreadSheetId}`);
        return spreadSheetId || '';
    }, [spreadSheetId]);

    const stableChatId = useMemo(() => {
        console.log(`🔧 [FileUploadSheetRender] Chat ID 안정화: ${chatId}`);
        return chatId || '';
    }, [chatId]);

    const stableUserId = useMemo(() => {
        console.log(`🔧 [FileUploadSheetRender] User ID 안정화: ${userId}`);
        return userId || '';
    }, [userId]);

    const stableSpreadsheetVersionId = useSpreadSheetVersionStore((state) => state.spreadSheetVersionId);
    const stableActivity = 'normal';

    useCheckAndLoadOnMount(
        stableSpreadsheetId,
        stableChatId,
        stableUserId,
        stableActivity,
        stableSpreadsheetVersionId
    );
    // console.log('✅ [SpreadSheetRender] exists, loading, error:', { exists, loading, error });

    // sheetWidthNum 변경사항을 감지하여 SpreadJS resize 호출
    useEffect(() => {
        // SpreadJS 인스턴스가 있으면 즉시 refresh 호출
        if (spreadRef.current) {
            // requestAnimationFrame을 사용하여 브라우저 렌더링 사이클에 맞춰 실행
            requestAnimationFrame(() => {
                if (spreadRef.current) {
                    spreadRef.current.refresh();
                }
            });
        }
    }, [sheetWidthNum]);

    // FormulaBar 업데이트 함수
    const updateFormulaBar = () => {
        if (!spreadRef.current) return;

        const sheet = spreadRef.current.getActiveSheet();
        const row = sheet.getActiveRowIndex();
        const col = sheet.getActiveColumnIndex();

        // 셀 주소 업데이트 (예: A1, B2)
        // 컬럼 인덱스를 문자로 변환 (0->A, 1->B, ...)
        let colName = '';
        let tempCol = col;
        while (tempCol >= 0) {
            colName = String.fromCharCode(65 + (tempCol % 26)) + colName;
            tempCol = Math.floor(tempCol / 26) - 1;
        }
        const cellName = `${colName}${row + 1}`;
        setCellAddress(cellName);

        // 셀 값 또는 수식 업데이트
        const formula = sheet.getFormula(row, col);
        const value = sheet.getValue(row, col);
        setCellValue(formula ? `=${formula}` : (value || ''));
    };

    let initSpread = function (spread: any) {
        // props로 받은 ref에 저장 (Context가 폴링하는 바로 그 ref)
        spreadRef.current = spread;
        console.log('🔄 [SpreadSheetRender] spread 인스턴스 설정됨:', !!spread);

        // 이벤트 리스너 등록
        spread.bind(GC.Spread.Sheets.Events.SelectionChanged, updateFormulaBar);
        spread.bind(GC.Spread.Sheets.Events.CellChanged, updateFormulaBar);

        // 초기 FormulaBar 업데이트
        updateFormulaBar();
    };

    // FormulaBar 입력 처리
    const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCellValue(e.target.value);
    };

    const handleFormulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && spreadRef.current) {
            const sheet = spreadRef.current.getActiveSheet();
            const row = sheet.getActiveRowIndex();
            const col = sheet.getActiveColumnIndex();

            const value = cellValue;
            if (value.startsWith('=')) {
                // 수식 입력
                sheet.setFormula(row, col, value.substring(1));
            } else {
                // 일반 값 입력
                sheet.setValue(row, col, value);
            }
        } else if (e.key === 'Escape') {
            updateFormulaBar();
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Formula Bar */}
            <div className="flex-shrink-0 h-7 bg-white border-b border-gray-200 flex items-center px-2 gap-2">
                {/* 셀 주소 표시 */}
                <input
                    type="text"
                    value={cellAddress}
                    readOnly
                    className="h-6 w-12 px-2 py-1 text-sm border border-gray-300 text-center"
                />

                {/* fx 아이콘 */}
                <span className="text-gray-600 font-semibold text-sm">fx</span>

                {/* 수식/값 입력 */}
                <input
                    type="text"
                    value={cellValue}
                    onChange={handleFormulaChange}
                    onKeyDown={handleFormulaKeyDown}
                    className="h-6 flex-1 p-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#005de9] focus:border-[#005de9]"
                // placeholder="값 또는 수식 입력"
                />
            </div>

            {/* SpreadJS */}
            <div className="flex-1 w-full">
                <SpreadSheets
                    workbookInitialized={(spread) => initSpread(spread)}
                    hostStyle={{
                        width: '100%',
                        height: '100%',
                    }}>
                </SpreadSheets>
            </div>
        </div>
    );
}
