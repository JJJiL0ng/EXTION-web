//게스트 유저들이 처음 들어왔을떄 체험해보고 사용해볼 수 있는 페이지 파일을 업로드 하지 않고 사용하게 됨
"use client";

// Force dynamic rendering to avoid SSR issues with SpreadJS
export const dynamic = 'force-dynamic';
import React, { useState, useMemo, useEffect } from "react";
import { RangeSelector } from "./RangeSelector";
import FFileUploadButton from "./FIleUploadButton";
import { useFileState } from "@/_aaa_schema-converter/_sc-context/FileStateProvider";

import dynamicImport from "next/dynamic";

const SpreadSheet = dynamicImport(
    () => {
        return import("./sc-spreadsheetRenderer");
    },
    { ssr: false }
);

export interface DualSpreadViewerProps {
    onBack?: () => void;
    spreadRefSourceSheet: React.MutableRefObject<any>;
    spreadRefTargetSheet: React.MutableRefObject<any>;
}

export default function DualSpreadViewer({
    onBack,
    spreadRefSourceSheet,
    spreadRefTargetSheet
}: DualSpreadViewerProps) {
    const { sourceFile, targetFile } = useFileState();

    // spread ref가 변경될 때 리렌더링을 트리거하기 위한 state
    const [sourceSpread, setSourceSpread] = useState<any>(null);
    const [targetSpread, setTargetSpread] = useState<any>(null);

    // spread ref가 설정되면 state 업데이트
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (spreadRefSourceSheet.current && !sourceSpread) {
                setSourceSpread(spreadRefSourceSheet.current);
            }
            if (spreadRefTargetSheet.current && !targetSpread) {
                setTargetSpread(spreadRefTargetSheet.current);
            }
            if (spreadRefSourceSheet.current && spreadRefTargetSheet.current) {
                clearInterval(checkInterval);
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, [sourceSpread, targetSpread, spreadRefSourceSheet, spreadRefTargetSheet]);


    return (
        <div className="flex flex-col h-screen w-screen fixed inset-0" style={{ overflow: 'hidden' }}>
            {/* Back Button */}
            {onBack && (
                <div className="p-2 bg-white border-b flex-shrink-0">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-[#005de9] text-white rounded hover:bg-blue-600"
                    >
                        ← 돌아가기
                    </button>
                </div>
            )}
            
            {/* Spreadsheets Side by Side */}
            <div className="flex flex-1 gap-4 p-4" style={{ overflow: 'hidden' }}>
                {/* Source Spreadsheet - Left */}
                <div className="flex-1 flex flex-col border rounded-lg shadow-sm" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div className="p-2 bg-gray-100 border-b rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {!sourceFile && <FFileUploadButton viewerType="source" />}
                            {sourceFile && <h3 className="font-semibold truncate">Source: {sourceFile.name}</h3>}
                        </div>
                    </div>
                    {sourceFile && <RangeSelector spread={sourceSpread} viewerType="source"/>}
                    <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                        <SpreadSheet spreadRef={spreadRefSourceSheet} file={sourceFile || undefined} />
                    </div>
                </div>

                {/* Target Spreadsheet - Right */}
                <div className="flex-1 flex flex-col border rounded-lg shadow-sm" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div className="p-2 bg-gray-100 border-b rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {!targetFile && <FFileUploadButton viewerType="target" />}
                            {targetFile && <h3 className="font-semibold truncate">Target: {targetFile.name}</h3>}
                        </div>
                    </div>
                    {targetFile && <RangeSelector spread={targetSpread} viewerType="target"/>}
                    <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                        <SpreadSheet spreadRef={spreadRefTargetSheet} file={targetFile || undefined} />
                    </div>
                </div>
            </div>
        </div>
    )
}

