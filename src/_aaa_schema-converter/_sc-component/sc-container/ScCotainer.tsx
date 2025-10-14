"use client";
import React, { useState, useMemo } from "react";
import TwoFileUpload from "../sc-fileupload/TwoFileUpload";
import DualSpreadViewer from "../sc-sheet/DualSpreadViewer";
import { Target } from "lucide-react";
import { TargetSheetContext, TargetSheetProvider } from "@/_aaa_schema-converter/_sc-context/TargetSheetProvider";
import { SourceSheetProvider } from "@/_aaa_schema-converter/_sc-context/SourceSheetProvider";

export default function ScContainer() {
    const [files, setFiles] = useState<{
        source: File | null;
        target: File | null;
    }>({ source: null, target: null });

    const [step, setStep] = useState<'upload' | 'compare'>('upload');

    const handleFilesReady = (sourceFile: File, targetFile: File) => {
        setFiles({ source: sourceFile, target: targetFile });
        setStep('compare');
    };

    const handleBack = () => {
        setStep('upload');
        // 선택적으로 파일도 초기화할 수 있습니다
        // setFiles({ source: null, target: null });
    };
    const spreadRefSourceSheet = useMemo(() => ({ current: null }), []);
    const spreadRefTargetSheet = useMemo(() => ({ current: null }), []);


    return (
        <>
            {step === 'upload' ? (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans" style={{ backgroundColor: '#EEF2F6' }}>
                    <div className="w-full max-w-5xl sm:max-w-4xl">
                        <div className="bg-white border-2 border-dashed border-gray-400 rounded sm:rounded p-6 sm:p-6">
                            <TwoFileUpload onFilesReady={handleFilesReady} />
                        </div>
                    </div>
                </div>
            ) : (
                files.source && files.target && (
                    <TargetSheetProvider spreadRef={spreadRefTargetSheet}>
                        <SourceSheetProvider spreadRef={spreadRefSourceSheet}>
                            <DualSpreadViewer
                                sourceFile={files.source}
                                targetFile={files.target}
                                onBack={handleBack}
                                spreadRefSourceSheet={spreadRefSourceSheet}
                                spreadRefTargetSheet={spreadRefTargetSheet}
                            />
                        </SourceSheetProvider>
                    </TargetSheetProvider>
                )
            )}
        </>
    );

}