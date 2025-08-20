"use client";

import dynamic from "next/dynamic";

const SpreadSheet = dynamic(
  () => {
    return import("../../../components/spreadjs/Spreadsheet");
  },
  { ssr: false }
);

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        SpreadJS 엑셀 뷰어
      </h1>
      <SpreadSheet />
    </div>
  )
}