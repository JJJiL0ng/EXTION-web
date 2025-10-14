'use client';

import React, { useState, useEffect } from 'react';
import { SpreadSheets } from '@mescius/spread-sheets-react';
import * as GC from '@mescius/spread-sheets';
import '@mescius/spread-sheets-io';
import '@mescius/spread-sheets-resources-ko';

// 샘플용 라이선스
const SpreadJSKey = "extion.ai|www.extion.ai,994437339345835#B14QusSMWhke8lnc4pUc8EXSwo7dVZTdiBzLYN6U5dHN6Q4bVhmTjRWRYJGauVkawIFdNl7b7V6YzoGWkRjUM9mTxEUe4J6UE3ENLtyK6U6Twg6V6ZkVoFnMRZDULh7UVpHcyBlTJd4S9s6dvMTSnJ7LalkRJJ5TUhzcE3EcHdDRwQDe6dHTxEGeycDMsJEbiFFV92SOXJGZ5llMwg7M9VzMsJGSrEkds36R7h5dnJGTtxGZ69EcpFFcvcHe0JVU52me9gzZ5J4KaFmZVRlQStUciNlRwYmQZt6VWdDWuFFVklzVtdFdxRzNqV6UZJVb83UeZdkI0IyUiwiI6EDMCBTNFdjI0ICSiwyM4UTN7YDO4kTM0IicfJye#4Xfd5nIIlkSCJiOiMkIsICOx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiYjM6UDNwACMygDM5IDMyIiOiQncDJCLikWYu86bpRHel9yd7dHLpFmLu3Wa4hXZiojIz5GRiwiIkqI1cSI1sa00wyY1iojIh94QiwiI5MDO5QzM9MzM7MDN4kTOiojIklkIs4XXbpjInxmZiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdIlDas9GerImVuF7alljavpFOKVlbSNVOJtWcsdjN4cFNWplZ6FTUrEzcsNFW5EEc8M7UGREaDFHULp7L9JHZnpGU9p4dVVHO8FTSNFGa8VzROVURx5GR4EESHlTNjRWULt";
GC.Spread.Sheets.LicenseKey = SpreadJSKey;
GC.Spread.Common.CultureManager.culture("en-us");

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
    if (spreadRef.current && file) {
      const spread = spreadRef.current;
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
      sheet.getCell(0,3).value('to get ');
      sheet.getCell(0,4).value('started!');
    }
  };

  return (
    <SpreadSheets
      workbookInitialized={(spread) => initSpread({ spread })}
      hostStyle={hostStyle}
    ></SpreadSheets>
  );
}
