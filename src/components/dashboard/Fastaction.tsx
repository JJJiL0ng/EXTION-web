"use client";

import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useGenerateSpreadSheetId } from '../../_hooks/sheet/useGenerateSpreadSheetId';
import { useGenerateChatId } from '../../_hooks/chat/useGenerateChatId';

const FastActionButtons: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateSpreadSheetId } = useGenerateSpreadSheetId();
  const { generateChatId } = useGenerateChatId();

  // handleFileChange를 컴포넌트 내부로 이동
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('선택된 파일:', file.name, file.type, file.size);
      
      // 파일 유효성 검사
      const allowedTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv', // .csv
        'application/csv' // .csv (일부 브라우저)
      ];
      
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['xls', 'xlsx', 'csv'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        alert('지원되는 파일 형식이 아닙니다. Excel 파일(.xlsx, .xls) 또는 CSV 파일(.csv)만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 제한 (예: 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.');
        return;
      }
      
      // 새 ID 생성 후 파일과 함께 스토어에 저장
      const spreadsheetId = generateSpreadSheetId();
      const chatId = generateChatId();
            
      // 새 창에서 sheetchat 페이지 열기
      const url = `/sheetchat/${spreadsheetId}/${chatId}`;
      window.open(url, '_blank');
      
      console.log('파일 업로드 처리 완료:', file.name);
      console.log('새 창 URL:', url);
    }
  };

  // 새로운 SpreadSheet ID와 Chat ID를 생성하여 동적 URL 만들기
  const createNewSheetChatUrl = () => {
    const spreadsheetId = generateSpreadSheetId();
    const chatId = generateChatId();
    return `/sheetchat/${spreadsheetId}/${chatId}`;
  };

  // 새 시트 생성 버튼 클릭 핸들러
  const handleNewSheetClick = () => {
    window.open(createNewSheetChatUrl(), '_blank');
  };

  return (
    <div className="grid grid-cols-2 gap-4 mx-auto">
      {/* 숨겨진 파일 input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        style={{ display: 'none' }}
      />
      
      {/* 기존 엑셀 파일 업로드 버튼 */}
      <button onClick={handleNewSheetClick} className="w-full bg-white border border-gray-200 hover:border-[#005de9] hover:bg-blue-50 transition-all duration-200 rounded-lg p-4 text-left group">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <Upload className="w-7 h-7 text-[#005de9]" />
          </div>
          <div className="flex-1">
            <span className="text-sm text-gray-900 group-hover:text-[#005de9] transition-colors">
              <span className="font-semibold">기존 엑셀 파일 업로드</span> <br /> <span className="text-gray-500">기존의 csv, xlsx 파일을 업로드하여 ai와 작업하세요</span>
            </span>
          </div>
        </div>
      </button>

      {/* 새 작업 시트 생성 버튼 */}
      <button onClick={handleNewSheetClick} className="w-full bg-white border border-gray-200 hover:border-[#005de9] hover:bg-blue-50 transition-all duration-200 rounded-lg p-4 text-left group">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <FileSpreadsheet className="w-7 h-7 text-[#005de9]" />
          </div>
          <div className="flex-1">
            <span className="text-sm text-gray-900 group-hover:text-[#005de9] transition-colors">
              <span className="font-semibold">빈 작업 시트 생성</span> <br /> <span className="text-gray-500">빈 시트에서 시작하여 새로운 데이터를 작성하고 관리하세요</span>
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default FastActionButtons;