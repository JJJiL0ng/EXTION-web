"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { SpreadSheetToolbar } from "@/_aaa_sheetChat/_components/sheet/SpreadSheetToolbar";
import ChattingContainer from "@/_aaa_sheetChat/_aa_superRefactor/compo/chat/ChattingContainer";
import { Resizer } from "@/_aaa_sheetChat/_aa_superRefactor/compo/resize/Resizer";
import { useResizer } from "@/_aaa_sheetChat/_aa_superRefactor/hookkk/resize/useResizer";
import { SpreadsheetProvider } from "@/_aaa_sheetChat/_contexts/SpreadsheetContext";

import useSpreadsheetIdStore from "@/_aaa_sheetChat/_store/sheet/spreadSheetIdStore";
import useChatStore from "@/_aaa_sheetChat/_store/chat/chatIdAndChatSessionIdStore";
import { useIsEmptySheetStore } from "@/_aaa_sheetChat/_aa_superRefactor/store/sheet/isEmptySheetStore";
import { useChatVisibilityState } from "@/_aaa_sheetChat/_aa_superRefactor/store/chat/chatVisibilityStore";
import useFileNameStore from "@/_aaa_sheetChat/_store/sheet/fileNameStore";
import useUserIdStore from "@/_aaa_sheetChat/_aa_superRefactor/store/user/userIdStore";

import dynamic from "next/dynamic";

const SpreadSheet = dynamic(
    () => {
        return import("../../../../../_aaa_sheetChat/_aa_superRefactor/compo/sheet/SpreadSheetRender");
    },
    { ssr: false }
);

export default function Home() {
    const params = useParams();
    const router = useRouter();
    const userId = useUserIdStore((state) => state.userId);
    const { setSpreadSheetId } = useSpreadsheetIdStore();
    const { setChatId } = useChatStore();
    const { setIsEmptySheet } = useIsEmptySheetStore();
    const { chatVisability, setChatVisability } = useChatVisibilityState();
    const fileName = useFileNameStore((state) => state.fileName);

    // userId 검증 - 없으면 /invite-check로 리다이렉트
    useEffect(() => {
        if (!userId) {
            console.log('⚠️ [SheetChat] userId 없음 - /invite-check로 리다이렉트');
            router.push('/invite-check');
            return;
        }

        console.log('✅ [SheetChat] userId 존재:', userId);
    }, [userId, router]);

    // chatVisability에 따라 동적으로 레이아웃 비율 계산
    const dynamicLeftWidth = chatVisability ? 75 : 100;
    const dynamicRightWidth = chatVisability ? 25 : 0;

    const {
        leftWidth,
        rightWidth,
        isResizing,
        containerRef,
        startResize
    } = useResizer({
        initialLeftWidth: dynamicLeftWidth,
        minLeftWidth: chatVisability ? 50 : 100,
        maxLeftWidth: chatVisability ? 80 : 100
    });

    // 컴포넌트 마운트 시 초기 상태 설정
    useEffect(() => {
        setChatVisability(true);
    }, [setChatVisability]);

    useEffect(() => {
        if (params?.SpreadSheetId && typeof params.SpreadSheetId === 'string') {
            setSpreadSheetId(params.SpreadSheetId);
        }

        if (params?.ChatId && typeof params.ChatId === 'string') {
            setChatId(params.ChatId);
        }
        setIsEmptySheet(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    // 파일명이 변경될 때마다 페이지 제목(탭 제목) 동적 업데이트
    useEffect(() => {
        if (fileName) {
            document.title = fileName;
        } else {
            document.title = "EXTION"; // 기본 제목
        }
    }, [fileName]);

    const spreadRef = useMemo(() => ({ current: null }), []);

    // 초기값을 시트가 업로드 되어 있는 상태라서false로 설정

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
                            width: chatVisability ? `${leftWidth}%` : '100%',
                            willChange: isResizing ? 'width' : 'auto',
                            transition: isResizing ? 'none' : 'width 0.3s ease-out'
                        }}
                    >
                        <SpreadSheet sheetWidthNum={chatVisability ? leftWidth : 100} spreadRef={spreadRef} />
                    </div>

                    {chatVisability && (
                        <Resizer
                            onMouseDown={startResize}
                            isResizing={isResizing}
                        />
                    )}

                    {chatVisability && (
                        <div
                            className="flex-1"
                            style={{
                                width: `${rightWidth}%`,
                                willChange: isResizing ? 'width' : 'auto',
                                transition: isResizing ? 'none' : 'width 0.3s ease-out'
                            }}
                        >
                            <ChattingContainer />
                        </div>
                    )}
                </div>
            </SpreadsheetProvider>
        </div>
    )
}
