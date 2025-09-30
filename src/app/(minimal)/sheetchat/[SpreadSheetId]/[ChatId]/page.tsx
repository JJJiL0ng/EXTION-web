"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";

import { SpreadSheetToolbar } from "@/_components/sheet/SpreadSheetToolbar";
import ChattingContainer from "@/_aa_superRefactor/compo/chat/ChattingContainer";
import { Resizer } from "@/_aa_superRefactor/compo/resize/Resizer";
import { useResizer } from "@/_aa_superRefactor/hookkk/resize/useResizer";
import { SpreadsheetProvider } from "@/_contexts/SpreadsheetContext";

import useSpreadsheetIdStore from "@/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_store/chat/chatIdAndChatSessionIdStore";
import { useIsEmptySheetStore } from "@/_aa_superRefactor/store/sheet/isEmptySheetStore";

import dynamic from "next/dynamic";

const SpreadSheet = dynamic(
    () => {
        return import("../../../../../_aa_superRefactor/compo/sheet/SpreadSheetRender");
    },
    { ssr: false }
);

export default function Home() {
    const params = useParams();
    const { setSpreadSheetId } = useSpreadsheetIdStore();
    const { setChatId } = useChatStore();
    const { setIsEmptySheet } = useIsEmptySheetStore();


    useEffect(() => {
        if (params?.SpreadSheetId && typeof params.SpreadSheetId === 'string') {
            setSpreadSheetId(params.SpreadSheetId);
        }

        if (params?.ChatId && typeof params.ChatId === 'string') {
            setChatId(params.ChatId);
        }
        setIsEmptySheet(true);

    }, [params, setSpreadSheetId, setChatId]);

    const spreadRef = useMemo(() => ({ current: null }), []);

    // 초기값을 시트가 업로드 되어 있는 상태라서false로 설정

    const {
        leftWidth,
        rightWidth,
        isResizing,
        containerRef,
        startResize
    } = useResizer({
        initialLeftWidth: 75,
        minLeftWidth: 50,
        maxLeftWidth: 80
    });

    return (
        <div className="flex flex-col h-screen" style={{ overflow: 'hidden' }}>
            <SpreadsheetProvider spreadRef={spreadRef}>
                {/* 2층: 스프레드시트 툴바 - 전체 너비 */}
                <div className="flex-shrink-0 w-full border-b-2 border-gray-200">
                    <SpreadSheetToolbar />
                </div>

                {/* 1층: 스프레드시트 | 리사이저 | 채팅 컨테이너 */}
                <div
                    ref={containerRef}
                    className="flex flex-1"
                    style={{ overflow: 'hidden' }}
                >
                    <div
                        className="flex-shrink-0"
                        style={{
                            width: `${leftWidth}%`,
                            willChange: isResizing ? 'width' : 'auto',
                            transition: isResizing ? 'none' : 'width 0.1s ease-out'
                        }}
                    >
                        <SpreadSheet sheetWidthNum={leftWidth} spreadRef={spreadRef} />
                    </div>

                    <Resizer
                        onMouseDown={startResize}
                        isResizing={isResizing}
                    />

                    <div
                        className="flex-1"
                        style={{
                            width: `${rightWidth}%`,
                            willChange: isResizing ? 'width' : 'auto',
                            transition: isResizing ? 'none' : 'width 0.1s ease-out'
                        }}
                    >
                        <ChattingContainer />
                    </div>
                </div>
            </SpreadsheetProvider>
        </div>
    )
}
