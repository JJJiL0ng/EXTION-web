"use client";
import React, { useMemo } from "react";
import { SpreadSheetToolbar } from "@/_components/sheet/SpreadSheetToolbar";
import ChattingContainer from "@/_aa_superRefactor/compo/chat/ChattingContainer";
import { Resizer } from "@/_aa_superRefactor/compo/resize/Resizer";
import { useResizer } from "@/_aa_superRefactor/hookkk/resize/useResizer";
import { SpreadsheetProvider } from "@/_contexts/SpreadsheetContext";

import dynamic from "next/dynamic";

const SpreadSheet = dynamic(
    () => {
        return import("../../../../../_aa_superRefactor/compo/sheet/SpreadSheetRender");
    },
    { ssr: false }
);



export default function Home() {
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

                <SpreadSheet sheetWidthNum={leftWidth} />

                <Resizer
                    onMouseDown={startResize}
                    isResizing={isResizing}
                />

                <ChattingContainer chattingWidthNum={rightWidth} />

            </SpreadsheetProvider>
        </div>
    )
}
