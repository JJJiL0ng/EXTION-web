"use client";
import React, { useMemo } from "react";
import DualSpreadViewer from "../sc-sheet/DualSpreadViewer";
import { TargetSheetProvider } from "@/_aaa_schema-converter/_sc-context/TargetSheetProvider";
import { SourceSheetProvider } from "@/_aaa_schema-converter/_sc-context/SourceSheetProvider";

export default function ScContainer() {
    const spreadRefSourceSheet = useMemo(() => ({ current: null }), []);
    const spreadRefTargetSheet = useMemo(() => ({ current: null }), []);

    return (
        <TargetSheetProvider spreadRef={spreadRefTargetSheet}>
            <SourceSheetProvider spreadRef={spreadRefSourceSheet}>
                <DualSpreadViewer
                    spreadRefSourceSheet={spreadRefSourceSheet}
                    spreadRefTargetSheet={spreadRefTargetSheet}
                />
            </SourceSheetProvider>
        </TargetSheetProvider>
    );
}