//게스트 유저들이 처음 들어왔을떄 체험해보고 사용해볼 수 있는 페이지 파일을 업로드 하지 않고 사용하게 됨
"use client";

// Force dynamic rendering to avoid SSR issues with SpreadJS
export const dynamic = 'force-dynamic';
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

import { SpreadSheetToolbar } from "@/_aaa_sheetChat/_components/sheet/SpreadSheetToolbar";
import ChattingContainer from "@/_aaa_sheetChat/_aa_superRefactor/compo/chat/ChattingContainer";
import { Resizer } from "@/_aaa_sheetChat/_aa_superRefactor/compo/resize/Resizer";
import { useResizer } from "@/_aaa_sheetChat/_aa_superRefactor/hookkk/resize/useResizer";
import { SpreadsheetProvider } from "@/_aaa_sheetChat/_contexts/SpreadsheetContext";

import useSpreadsheetIdStore from "@/_aaa_sheetChat/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_aaa_sheetChat/_store/chat/chatIdAndChatSessionIdStore";

import { useGenerateSpreadSheetId } from "@/_aaa_sheetChat/_hooks/sheet/common/useGenerateSpreadSheetId";
import { useGenerateChatId } from "@/_aaa_sheetChat/_hooks/aiChat/useGenerateChatId";
import { useIsEmptySheetStore } from "@/_aaa_sheetChat/_aa_superRefactor/store/sheet/isEmptySheetStore";
import { useSpreadSheetVersionStore } from "@/_aaa_sheetChat/_store/sheet/spreadSheetVersionIdStore";
import useUserIdStore from "@/_aaa_sheetChat/_aa_superRefactor/store/user/userIdStore";

import dynamicImport from "next/dynamic";

const SpreadSheet = dynamicImport(
    () => {
        return import("../../../_aaa_sheetChat/_aa_superRefactor/compo/sheet/SpreadSheetRender");
    },
    { ssr: false }
);

export default function Home() {
    const router = useRouter();
    const userId = useUserIdStore((state) => state.userId);

    const { generateSpreadSheetId } = useGenerateSpreadSheetId();
    const { generateChatId } = useGenerateChatId();
    const { setSpreadSheetId } = useSpreadsheetIdStore();
    const { setChatId } = useChatStore();
    const { setIsEmptySheet } = useIsEmptySheetStore();

    const { setEditLockVersion } = useSpreadSheetVersionStore();

    const spreadRef = useMemo(() => ({ current: null }), []);

    // userId 검증 - 없으면 /invite-check로 리다이렉트
    useEffect(() => {
        if (!userId) {
            console.log('⚠️ [TryPage] userId 없음 - /invite-check로 리다이렉트');
            router.push('/invite-check');
            return;
        }

        console.log('✅ [TryPage] userId 존재:', userId);
    }, [userId, router]);

    // useEffect를 사용하여 컴포넌트 마운트 시에만 ID를 생성하고 설정
    useEffect(() => {
        const SpreadSheetID = generateSpreadSheetId();
        const ChatID = generateChatId();

        setSpreadSheetId(SpreadSheetID);
        setChatId(ChatID);
        // 초기값을 시트가 업로드 되어 있는 상태라서 true로 설정
        // const [isEmptySheet, setIsEmptySheet] = useState(true);
        setIsEmptySheet(true);
        setEditLockVersion(1);

    }, [generateSpreadSheetId, generateChatId, setSpreadSheetId, setChatId, setIsEmptySheet]);


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
