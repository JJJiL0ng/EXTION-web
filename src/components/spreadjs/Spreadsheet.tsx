"use client";

import React from "react";

export default function SpreadSheet() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">SpreadJS 컴포넌트</h2>
        <p className="text-gray-600">SpreadJS 라이브러리가 필요합니다.</p>
        <p className="text-sm text-gray-500 mt-2">
          현재 컴포넌트가 비활성화되어 있습니다.
        </p>
      </div>
    </div>
  );
}