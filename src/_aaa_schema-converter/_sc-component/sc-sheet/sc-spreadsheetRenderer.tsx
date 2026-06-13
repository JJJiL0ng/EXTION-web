'use client';

import React, { useState, useEffect } from 'react';
import { SpreadSheets } from '@mescius/spread-sheets-react';
import { configureSpreadRuntime, GC } from '@/shared/spreadjs/spreadRuntime';

configureSpreadRuntime();

export interface SpreadSheetProps {
  spreadRef: React.MutableRefObject<any>; // Context가 폴링하는 ref
  file?: File; // Optional file to load
}

export default function SpreadSheet({ spreadRef, file }: SpreadSheetProps) {
  const [hostStyle, setHostStyle] = useState({
    width: '100%',
    height: '100%',
    border: '1px solid darkgray',
  });

  // Watch for file changes and reload
  useEffect(() => {
    if (!spreadRef.current) return;

    const spread = spreadRef.current;

    if (file) {
      // File is provided - load it
      const fileExtension = file.name.toLowerCase().split('.').pop();
      let importOptions;

      if (fileExtension === 'csv') {
        importOptions = {
          fileType: GC.Spread.Sheets.FileType.csv,
          includeStyles: true,
          includeFormulas: true
        };
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        importOptions = {
          fileType: GC.Spread.Sheets.FileType.excel,
          includeStyles: true,
          includeFormulas: true
        };
      } else {
        console.error('Unsupported file type:', fileExtension);
        return;
      }

      // Import the file
      spread.import(
        file,
        () => {
          try {
            console.log('File loaded successfully:', file.name);
            const sheet = spread.getActiveSheet();
            if (sheet && sheet.resumePaint && typeof sheet.resumePaint === 'function') {
              sheet.resumePaint();
            }
          } catch (error) {
            console.error('Error in success callback:', error);
          }
        },
        (error: any) => {
          try {
            console.error('Error loading file:', error);
            const sheet = spread.getActiveSheet();
            if (sheet && sheet.resumePaint && typeof sheet.resumePaint === 'function') {
              sheet.resumePaint();
            }
          } catch (resumeError) {
            console.error('Error in error callback:', resumeError);
          }
        },
        importOptions
      );
    } else {
      // File is null - reset to empty state
      spread.clearSheets();
      spread.addSheet(0);
      const sheet = spread.getActiveSheet();
      sheet
        .getCell(0, 0)
        .vAlign(GC.Spread.Sheets.VerticalAlign.center)
        .value('Upload');

      sheet.getCell(0, 1).value('a .csv or ');
      sheet.getCell(0, 2).value(' .xlsx file');
      sheet.getCell(0, 3).value('to get ');
      sheet.getCell(0, 4).value('started!');
    }
  }, [file, spreadRef]);

  let initSpread = function ({ spread }: { spread: any }) {
    // Assign spread to ref for context polling
    if (spreadRef) {
      spreadRef.current = spread;
    }

    // If file is provided at initialization, load it (this handles the initial file case)
    if (file) {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      let importOptions;

      if (fileExtension === 'csv') {
        importOptions = {
          fileType: GC.Spread.Sheets.FileType.csv,
          includeStyles: true,
          includeFormulas: true
        };
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        importOptions = {
          fileType: GC.Spread.Sheets.FileType.excel,
          includeStyles: true,
          includeFormulas: true
        };
      } else {
        console.error('Unsupported file type:', fileExtension);
        return;
      }

      // Import the file directly using spread.import()
      spread.import(
        file,
        () => {
          try {
            console.log('File loaded successfully:', file.name);
            const sheet = spread.getActiveSheet();
            if (sheet && sheet.resumePaint && typeof sheet.resumePaint === 'function') {
              sheet.resumePaint();
            }
          } catch (error) {
            console.error('Error in success callback:', error);
          }
        },
        (error: any) => {
          try {
            console.error('Error loading file:', error);
            const sheet = spread.getActiveSheet();
            if (sheet && sheet.resumePaint && typeof sheet.resumePaint === 'function') {
              sheet.resumePaint();
            }
          } catch (resumeError) {
            console.error('Error in error callback:', resumeError);
          }
        },
        importOptions
      );
    } else {
      // Default initialization if no file - show empty spreadsheet
      let sheet = spread.getActiveSheet();
      sheet
        .getCell(0, 0)
        .vAlign(GC.Spread.Sheets.VerticalAlign.center)
        .value('Upload');

      sheet.getCell(0, 1).value('a .csv or ');

      sheet.getCell(0, 2).value(' .xlsx file');
      sheet.getCell(0, 3).value('to get ');
      sheet.getCell(0, 4).value('started!');
    }
  };

  return (
    <SpreadSheets
      workbookInitialized={(spread) => initSpread({ spread })}
      hostStyle={hostStyle}
    ></SpreadSheets>
  );
}
