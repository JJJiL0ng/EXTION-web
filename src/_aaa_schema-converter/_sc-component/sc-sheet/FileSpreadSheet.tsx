"use client";

import React, { useState } from "react";
import { SpreadSheets, Worksheet } from "@mescius/spread-sheets-react";
import * as GC from "@mescius/spread-sheets";
import * as ExcelIO from "@mescius/spread-excelio";

const SpreadJSKey = "extion.ai|www.extion.ai,994437339345835#B14QusSMWhke8lnc4pUc8EXSwo7dVZTdiBzLYN6U5dHN6Q4bVhmTjRWRYJGauVkawIFdNl7b7V6YzoGWkRjUM9mTxEUe4J6UE3ENLtyK6U6Twg6V6ZkVoFnMRZDULh7UVpHcyBlTJd4S9s6dvMTSnJ7LalkRJJ5TUhzcE3EcHdDRwQDe6dHTxEGeycDMsJEbiFFV92SOXJGZ5llMwg7M9VzMsJGSrEkds36R7h5dnJGTtxGZ69EcpFFcvcHe0JVU52me9gzZ5J4KaFmZVRlQStUciNlRwYmQZt6VWdDWuFFVklzVtdFdxRzNqV6UZJVb83UeZdkI0IyUiwiI6EDMCBTNFdjI0ICSiwyM4UTN7YDO4kTM0IicfJye#4Xfd5nIIlkSCJiOiMkIsICOx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiYjM6UDNwACMygDM5IDMyIiOiQncDJCLikWYu86bpRHel9yd7dHLpFmLu3Wa4hXZiojIz5GRiwiIkqI1cSI1sa00wyY1iojIh94QiwiI5MDO5QzM9MzM7MDN4kTOiojIklkIs4XXbpjInxmZiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdIlDas9GerImVuF7alljavpFOKVlbSNVOJtWcsdjN4cFNWplZ6FTUrEzcsNFW5EEc8M7UGREaDFHULp7L9JHZnpGU9p4dVVHO8FTSNFGa8VzROVURx5GR4EESHlTNjRWULt";
GC.Spread.Sheets.LicenseKey = SpreadJSKey;
(ExcelIO as any).LicenseKey = SpreadJSKey;
GC.Spread.Common.CultureManager.culture("en-us");

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
