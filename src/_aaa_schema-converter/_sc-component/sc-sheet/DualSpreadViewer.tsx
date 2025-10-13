//게스트 유저들이 처음 들어왔을떄 체험해보고 사용해볼 수 있는 페이지 파일을 업로드 하지 않고 사용하게 됨
"use client";

// Force dynamic rendering to avoid SSR issues with SpreadJS
export const dynamic = 'force-dynamic';
import React, { useState, useMemo, useEffect } from "react";

import { SpreadsheetProvider } from "@/_aaa_sheetChat/_contexts/SpreadsheetContext";

import dynamicImport from "next/dynamic";

const SpreadSheet = dynamicImport(
    () => {
        return import("./sc-spreadsheetRenderer");
    },
    { ssr: false }
);

export interface DualSpreadViewerProps {
    sourceFile: File;
    targetFile: File;
    onBack: () => void;
}

export default function DualSpreadViewer({ sourceFile, targetFile, onBack }: DualSpreadViewerProps) {
    const spreadRefSourceSheet = useMemo(() => ({ current: null }), []);
    const spreadRefTargetSheet = useMemo(() => ({ current: null }), []);

    
    return (
        <div className="flex flex-col h-screen w-screen fixed inset-0" style={{ overflow: 'hidden' }}>
            {/* Back Button */}
            <div className="p-2 bg-white border-b flex-shrink-0">
                <button 
                    onClick={onBack}
                    className="px-4 py-2 bg-[#005de9] text-white rounded hover:bg-blue-600"
                >
                    ← 돌아가기
                </button>
            </div>
            
            {/* Spreadsheets Side by Side */}
            <div className="flex flex-1 gap-4 p-4" style={{ overflow: 'hidden' }}>
                {/* Source Spreadsheet - Left */}
                <div className="flex-1 flex flex-col border rounded-lg shadow-sm" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div className="p-2 bg-gray-100 border-b rounded-t-lg">
                        <h3 className="font-semibold truncate">Source: {sourceFile.name}</h3>
                    </div>
                    <SpreadsheetProvider spreadRef={spreadRefSourceSheet}>
                        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                            <SpreadSheet spreadRef={spreadRefSourceSheet} file={sourceFile} />
                        </div>
                    </SpreadsheetProvider>
                </div>

                {/* Target Spreadsheet - Right */}
                <div className="flex-1 flex flex-col border rounded-lg shadow-sm" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div className="p-2 bg-gray-100 border-b rounded-t-lg">
                        <h3 className="font-semibold truncate">Target: {targetFile.name}</h3>
                    </div>
                    <SpreadsheetProvider spreadRef={spreadRefTargetSheet}>
                        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                            <SpreadSheet spreadRef={spreadRefTargetSheet} file={targetFile} />
                        </div>
                    </SpreadsheetProvider>
                </div>
            </div>
        </div>
    )
}

