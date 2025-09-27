"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useSpreadJSInit } from '../../../_hooks/sheet/spreadjs/useSpreadJSInit';
import { SpreadSheets, Worksheet, Column } from "@mescius/spread-sheets-react";
import { useCheckAndLoadOnMount } from "@/_hooks/sheet/data_save/useCheckAndLoad";
import { useParams } from 'next/navigation';
import { getOrCreateGuestId } from "@/_utils/guestUtils";
import useSpreadsheetIdStore from "@/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_store/chat/chatIdAndChatSessionIdStore";
import { useSpreadSheetVersionStore } from '@/_store/sheet/spreadSheetVersionIdStore';

import * as GC from "@mescius/spread-sheets";


const SpreadJSKey = "extion.ai|www.extion.ai,994437339345835#B14QusSMWhke8lnc4pUc8EXSwo7dVZTdiBzLYN6U5dHN6Q4bVhmTjRWRYJGauVkawIFdNl7b7V6YzoGWkRjUM9mTxEUe4J6UE3ENLtyK6U6Twg6V6ZkVoFnMRZDULh7UVpHcyBlTJd4S9s6dvMTSnJ7LalkRJJ5TUhzcE3EcHdDRwQDe6dHTxEGeycDMsJEbiFFV92SOXJGZ5llMwg7M9VzMsJGSrEkds36R7h5dnJGTtxGZ69EcpFFcvcHe0JVU52me9gzZ5J4KaFmZVRlQStUciNlRwYmQZt6VWdDWuFFVklzVtdFdxRzNqV6UZJVb83UeZdkI0IyUiwiI6EDMCBTNFdjI0ICSiwyM4UTN7YDO4kTM0IicfJye#4Xfd5nIIlkSCJiOiMkIsICOx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiYjM6UDNwACMygDM5IDMyIiOiQncDJCLikWYu86bpRHel9yd7dHLpFmLu3Wa4hXZiojIz5GRiwiIkqI1cSI1sa00wyY1iojIh94QiwiI5MDO5QzM9MzM7MDN4kTOiojIklkIs4XXbpjInxmZiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdIlDas9GerImVuF7alljavpFOKVlbSNVOJtWcsdjN4cFNWplZ6FTUrEzcsNFW5EEc8M7UGREaDFHULp7L9JHZnpGU9p4dVVHO8FTSNFGa8VzROVURx5GR4EESHlTNjRWULt";
GC.Spread.Sheets.LicenseKey = SpreadJSKey;
GC.Spread.Common.CultureManager.culture("en-us");

interface SpreadSheetProps {
    sheetWidthNum: number; // refresh 트리거용으로 유지
    spreadRef: React.MutableRefObject<any>; // Context가 폴링하는 ref
}

export default function SpreadSheet({ sheetWidthNum, spreadRef }: SpreadSheetProps) {
    const { spreadSheetId } = useSpreadsheetIdStore();
    const { chatId } = useChatStore();

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
        const userId = getOrCreateGuestId();
        console.log(`🔧 [FileUploadSheetRender] User ID 안정화: ${userId}`);
        return userId;
    }, []);

    const stableSpreadsheetVersionId = useSpreadSheetVersionStore((state) => state.spreadSheetVersionId);
    const stableActivity = 'normal';

    const { exists, loading, error } = useCheckAndLoadOnMount(
        stableSpreadsheetId,
        stableChatId,
        stableUserId,
        stableActivity,
        stableSpreadsheetVersionId
    );
    console.log('✅ [SpreadSheetRender] exists, loading, error:', { exists, loading, error });

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

    let initSpread = function (spread: any) {
        // props로 받은 ref에 저장 (Context가 폴링하는 바로 그 ref)
        spreadRef.current = spread;
        console.log('🔄 [SpreadSheetRender] spread 인스턴스 설정됨:', !!spread);
    };

    return (
        <div
            className="w-full h-full"
            style={{
                transform: 'translateZ(0)', // GPU 가속 활성화
                backfaceVisibility: 'hidden' // 렌더링 최적화
            }}
        >
            <SpreadSheets
                workbookInitialized={(spread) => initSpread(spread)}
                hostStyle={{
                    width: '100%',
                    height: '100%',
                    transform: 'translateZ(0)' // SpreadJS 자체도 GPU 가속
                }}>
            </SpreadSheets>
        </div>
    );
}