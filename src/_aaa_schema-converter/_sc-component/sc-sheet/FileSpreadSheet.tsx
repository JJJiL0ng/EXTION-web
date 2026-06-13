"use client";

import React, { useState } from "react";
import { SpreadSheets, Worksheet } from "@mescius/spread-sheets-react";
import * as GC from "@mescius/spread-sheets";
import * as ExcelIO from "@mescius/spread-excelio";
import { configureSpreadRuntime, SPREADJS_LICENSE_KEY } from '@/shared/spreadjs/spreadRuntime';

configureSpreadRuntime();
(ExcelIO as any).LicenseKey = SPREADJS_LICENSE_KEY;

interface FileSpreadSheetProps {
  file: File;
  onLoadSuccess?: () => void;
  onLoadError?: (error: any) => void;
}

export default function FileSpreadSheet({ file, onLoadSuccess, onLoadError }: FileSpreadSheetProps) {
  const [hostStyle] = useState({
    width: '100%',
    height: '100%',
  });

  const initSpread = (spread: GC.Spread.Sheets.Workbook) => {
    console.log('🔧 SpreadSheet initialized for file:', file.name);
    console.log('🔍 Spread object:', spread);
    console.log('🔍 Spread methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(spread)));
    console.log('🔍 Has import?', typeof spread.import);

    const sheet = spread.getActiveSheet();

    // 파일 확장자 확인
    const fileExtension = file.name.toLowerCase().split('.').pop();
    let importOptions: any;

    if (fileExtension === 'csv') {
      importOptions = {
        fileType: GC.Spread.Sheets.FileType.csv,
        includeStyles: true,
        includeFormulas: true
      };
    } else {
      importOptions = {
        fileType: GC.Spread.Sheets.FileType.excel,
        includeStyles: true,
        includeFormulas: true
      };
    }

    // suspendPaint for performance
    if (sheet && sheet.suspendPaint) {
      sheet.suspendPaint();
    }

    // Spread의 import 메서드 사용
    spread.import(
      file,
      () => {
        console.log('✅ File loaded successfully:', file.name);

        // resumePaint
        if (sheet && sheet.resumePaint) {
          sheet.resumePaint();
        }

        if (onLoadSuccess) {
          onLoadSuccess();
        }
      },
      (error: any) => {
        console.error('❌ File load error:', file.name, error);

        // resumePaint on error
        if (sheet && sheet.resumePaint) {
          sheet.resumePaint();
        }

        if (onLoadError) {
          onLoadError(error);
        }
      },
      importOptions
    );
  };

  return (
    <SpreadSheets
      workbookInitialized={(spread) => initSpread(spread)}
      hostStyle={hostStyle}
    >
      <Worksheet />
    </SpreadSheets>
  );
}
