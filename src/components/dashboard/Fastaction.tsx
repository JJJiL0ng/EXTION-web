"use client";

import React from 'react';
import Link from 'next/link';
import { Upload, FileSpreadsheet } from 'lucide-react';

const FastActionButtons: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {/* 기존 엑셀 파일 업로드 버튼 */}
      <Link href="/fileupload">
        <button className="w-full bg-white border border-gray-200 hover:border-[#005de9] hover:bg-blue-50 transition-all duration-200 rounded-lg p-4 text-left group">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Upload className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-gray-900 group-hover:text-[#005de9] transition-colors">
                <span className="font-semibold">기존 엑셀 파일 업로드</span> · <span className="text-gray-500">기존의 csv, xlsx 파일을 업로드하여 ai와 작업하세요</span>
              </span>
            </div>
          </div>
        </button>
      </Link>

      {/* 새 작업 시트 생성 버튼 */}
      <Link href="/ai">
        <button className="w-full bg-white border border-gray-200 hover:border-[#005de9] hover:bg-blue-50 transition-all duration-200 rounded-lg p-4 text-left group">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-gray-900 group-hover:text-[#005de9] transition-colors">
                <span className="font-semibold">새 작업 시트 생성</span> · <span className="text-gray-500">빈 시트에서 시작하여 새로운 데이터를 작성하고 관리하세요</span>
              </span>
            </div>
          </div>
        </button>
      </Link>
    </div>
  );
};

export default FastActionButtons;