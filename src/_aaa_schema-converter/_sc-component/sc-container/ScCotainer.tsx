"use client";
import React, { useMemo } from "react";
import DualSpreadViewer from "../sc-sheet/DualSpreadViewer";
import { TargetSheetProvider } from "@/_aaa_schema-converter/_sc-context/TargetSheetProvider";
import { SourceSheetProvider } from "@/_aaa_schema-converter/_sc-context/SourceSheetProvider";
import { MappingTopBar } from "../sc-sheet/MappingTopBar";
import ScChatting from "./ScChatting";
import { useScChattingVisabliltyStore } from "@/_aaa_schema-converter/_sc-store/scChattingVisabiltyStore";

export default function ScContainer() {
    const spreadRefSourceSheet = useMemo(() => ({ current: null }), []);
    const spreadRefTargetSheet = useMemo(() => ({ current: null }), []);
    
    // Zustand 스토어에서 상태 직접 구독
    const scChattingVisablilty = useScChattingVisabliltyStore((state) => state.scChattingVisablilty);

    // 매핑 시작 핸들러
    const handleStartMapping = () => {
        // TODO: 여기에 실제 매핑 로직을 구현하세요
        console.log('매핑 프로세스 시작...');
        // 예: API 호출, 상태 업데이트 등
    };


    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            <TargetSheetProvider spreadRef={spreadRefTargetSheet}>
                <SourceSheetProvider spreadRef={spreadRefSourceSheet}>
                    {/* 매핑 정보 및 시작 버튼 탭바 */}
                    <MappingTopBar
                        spreadSourceRef={spreadRefSourceSheet}
                        spreadTargetRef={spreadRefTargetSheet}
                        onStartMapping={handleStartMapping}
                    />

                    {/* 듀얼 스프레드시트 뷰어와 채팅을 나란히 배치 */}
                    <div className="flex flex-1 overflow-hidden">
                        <DualSpreadViewer
                            spreadRefSourceSheet={spreadRefSourceSheet}
                            spreadRefTargetSheet={spreadRefTargetSheet}
                        />
                        {scChattingVisablilty && <ScChatting />}
                    </div>
                </SourceSheetProvider>
            </TargetSheetProvider>
        </div>
    );
}