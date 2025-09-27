"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSpreadJSInit } from '../../../_hooks/sheet/spreadjs/useSpreadJSInit';
import { SpreadSheets, Worksheet, Column } from "@mescius/spread-sheets-react";
import * as GC from "@mescius/spread-sheets";


const SpreadJSKey = "extion.ai|www.extion.ai,994437339345835#B14QusSMWhke8lnc4pUc8EXSwo7dVZTdiBzLYN6U5dHN6Q4bVhmTjRWRYJGauVkawIFdNl7b7V6YzoGWkRjUM9mTxEUe4J6UE3ENLtyK6U6Twg6V6ZkVoFnMRZDULh7UVpHcyBlTJd4S9s6dvMTSnJ7LalkRJJ5TUhzcE3EcHdDRwQDe6dHTxEGeycDMsJEbiFFV92SOXJGZ5llMwg7M9VzMsJGSrEkds36R7h5dnJGTtxGZ69EcpFFcvcHe0JVU52me9gzZ5J4KaFmZVRlQStUciNlRwYmQZt6VWdDWuFFVklzVtdFdxRzNqV6UZJVb83UeZdkI0IyUiwiI6EDMCBTNFdjI0ICSiwyM4UTN7YDO4kTM0IicfJye#4Xfd5nIIlkSCJiOiMkIsICOx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiYjM6UDNwACMygDM5IDMyIiOiQncDJCLikWYu86bpRHel9yd7dHLpFmLu3Wa4hXZiojIz5GRiwiIkqI1cSI1sa00wyY1iojIh94QiwiI5MDO5QzM9MzM7MDN4kTOiojIklkIs4XXbpjInxmZiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdIlDas9GerImVuF7alljavpFOKVlbSNVOJtWcsdjN4cFNWplZ6FTUrEzcsNFW5EEc8M7UGREaDFHULp7L9JHZnpGU9p4dVVHO8FTSNFGa8VzROVURx5GR4EESHlTNjRWULt";
GC.Spread.Sheets.LicenseKey = SpreadJSKey;
GC.Spread.Common.CultureManager.culture("en-us");

interface SpreadSheetProps {
    sheetWidthNum: number;
}

export default function SpreadSheet({ sheetWidthNum }: SpreadSheetProps) {
    // spread 인스턴스를 저장할 ref
    const spreadRef = useRef<any>(null);

    const [hostStyle, setHostStyle] = useState({
        width: `${sheetWidthNum}%`,
        height:  '100vh',
        minWidth: `${sheetWidthNum}%`,
        boxSizing: 'border-box' as const,
    });

    // sheetWidthNum 변경사항을 감지하여 hostStyle 업데이트 및 SpreadJS resize 호출
    useEffect(() => {
        setHostStyle({
            width: `${sheetWidthNum}%`,
            height: '100vh',
            minWidth: `${sheetWidthNum}%`,
            boxSizing: 'border-box' as const,
        });

        // SpreadJS 인스턴스가 있으면 명시적으로 resize 호출
        if (spreadRef.current) {
            setTimeout(() => {
                // 여러 가지 방법으로 SpreadJS 크기 업데이트 시도
                spreadRef.current.refresh();
                spreadRef.current.invalidateLayout();
                spreadRef.current.repaint();

                // window resize 이벤트도 발생시켜서 SpreadJS가 크기 변경을 인식하도록 함
                window.dispatchEvent(new Event('resize'));
            }, 10);
        }
    }, [sheetWidthNum]);

    let initSpread = function (spread: any) {
        // spread 인스턴스를 ref에 저장
        spreadRef.current = spread;
        let sheet = spread.getActiveSheet();
    };

    return (
        <div style={hostStyle}>
            <SpreadSheets
                key={`spread-${sheetWidthNum}`}
                workbookInitialized={(spread) => initSpread(spread)}
                hostStyle={{ width: '100%', height: '100%' }}>
            </SpreadSheets>
        </div>
    );
}