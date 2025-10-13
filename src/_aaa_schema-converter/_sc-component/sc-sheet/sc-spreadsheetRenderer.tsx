"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import { SpreadSheets, Worksheet, Column } from "@mescius/spread-sheets-react";

import * as GC from "@mescius/spread-sheets";


const SpreadJSKey = "extion.ai|www.extion.ai,994437339345835#B14QusSMWhke8lnc4pUc8EXSwo7dVZTdiBzLYN6U5dHN6Q4bVhmTjRWRYJGauVkawIFdNl7b7V6YzoGWkRjUM9mTxEUe4J6UE3ENLtyK6U6Twg6V6ZkVoFnMRZDULh7UVpHcyBlTJd4S9s6dvMTSnJ7LalkRJJ5TUhzcE3EcHdDRwQDe6dHTxEGeycDMsJEbiFFV92SOXJGZ5llMwg7M9VzMsJGSrEkds36R7h5dnJGTtxGZ69EcpFFcvcHe0JVU52me9gzZ5J4KaFmZVRlQStUciNlRwYmQZt6VWdDWuFFVklzVtdFdxRzNqV6UZJVb83UeZdkI0IyUiwiI6EDMCBTNFdjI0ICSiwyM4UTN7YDO4kTM0IicfJye#4Xfd5nIIlkSCJiOiMkIsICOx8idgMlSgQWYlJHcTJiOi8kI1tlOiQmcQJCLiYjM6UDNwACMygDM5IDMyIiOiQncDJCLikWYu86bpRHel9yd7dHLpFmLu3Wa4hXZiojIz5GRiwiIkqI1cSI1sa00wyY1iojIh94QiwiI5MDO5QzM9MzM7MDN4kTOiojIklkIs4XXbpjInxmZiwSZzxWYmpjIyNHZisnOiwmbBJye0ICRiwiI34zdIlDas9GerImVuF7alljavpFOKVlbSNVOJtWcsdjN4cFNWplZ6FTUrEzcsNFW5EEc8M7UGREaDFHULp7L9JHZnpGU9p4dVVHO8FTSNFGa8VzROVURx5GR4EESHlTNjRWULt";
GC.Spread.Sheets.LicenseKey = SpreadJSKey;
GC.Spread.Common.CultureManager.culture("en-us");

interface SpreadSheetProps {
    sheetWidthNum: number; // refresh 트리거용으로 유지
    spreadRef: React.MutableRefObject<any>; // Context가 폴링하는 ref
}

export default function SpreadSheet() {
  const [hostStyle, setHostStyle] = useState({
    width: '100%',
    height: '600px',
    border: '1px solid darkgray',
  });
interface InitSpreadFunction {
    (spread: GC.Spread.Sheets.Workbook): void;
}

let initSpread: InitSpreadFunction = function (spread: GC.Spread.Sheets.Workbook) {
    let sheet: GC.Spread.Sheets.Worksheet = spread.getActiveSheet();
    sheet
        .getCell(0, 0)
        .vAlign(GC.Spread.Sheets.VerticalAlign.center)
        .value('Hello SpreadJS!');
};
  return (
    <SpreadSheets
      workbookInitialized={(spread) => initSpread(spread)}
      hostStyle={hostStyle}
    ></SpreadSheets>
  );
}
