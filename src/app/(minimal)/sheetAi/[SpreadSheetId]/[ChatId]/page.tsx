"use client";
import React, { useMemo, useEffect } from "react";
import { useParams } from "next/navigation";

import { SpreadSheetToolbar } from "@/_components/sheet/SpreadSheetToolbar";
import ChattingContainer from "@/_aa_superRefactor/compo/chat/ChattingContainer";
import { Resizer } from "@/_aa_superRefactor/compo/resize/Resizer";
import { useResizer } from "@/_aa_superRefactor/hookkk/resize/useResizer";
import { SpreadsheetProvider } from "@/_contexts/SpreadsheetContext";
import { useCheckAndLoadOnMount } from "@/_hooks/sheet/data_save/useCheckAndLoad";
import useSpreadsheetIdStore from "@/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_store/chat/chatIdAndChatSessionIdStore";

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

    useEffect(() => {
        if (params?.SpreadSheetId && typeof params.SpreadSheetId === 'string') {
            setSpreadSheetId(params.SpreadSheetId);
        }

        if (params?.ChatId && typeof params.ChatId === 'string') {
            setChatId(params.ChatId);
        }

        // 저장된 값 확인
        // setTimeout(() => {
        //     const { spreadSheetId } = useSpreadsheetIdStore.getState();
        //     const { chatId } = useChatStore.getState();
        // }, 100);
    }, [params, setSpreadSheetId, setChatId]);

    const spreadRef = useMemo(() => ({ current: null }), []);

    const {
        leftWidth,
        rightWidth,
        isResizing,
        containerRef,
        startResize
    } = useResizer({
        initialLeftWidth: 80,
        minLeftWidth: 50,
        maxLeftWidth: 80
    });

    return (
        <div
            ref={containerRef}
            className="flex h-screen"
            style={{ overflow: 'hidden' }}
        >
            <SpreadsheetProvider spreadRef={spreadRef}>

                <div
                    className="flex-shrink-0"
                    style={{
                        width: `${leftWidth}%`,
                        willChange: isResizing ? 'width' : 'auto',
                        transition: isResizing ? 'none' : 'width 0.1s ease-out'
                    }}
                >
                    <SpreadSheet sheetWidthNum={leftWidth} />
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

            </SpreadsheetProvider>
        </div>
    )
}
