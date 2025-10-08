// src/_components/chat/FileUploadWelcomeMessage.tsx
// 파일 업로드 모드에서 표시되는 환영 메시지

import React from 'react';
import { UploadedFileInfo } from '@/_aaa_sheetChat/_types/chat.types';

interface FileUploadWelcomeMessageProps {
  fileInfo?: UploadedFileInfo;
}

export const FileUploadWelcomeMessage: React.FC<FileUploadWelcomeMessageProps> = ({ 
  fileInfo 
}) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-6">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          파일이 업로드되었습니다
        </h2>
        
        {fileInfo && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">파일명</div>
            <div className="font-medium text-gray-800">{fileInfo.fileName}</div>
            
            <div className="text-sm text-gray-600 mt-2 mb-1">파일 크기</div>
            <div className="text-sm text-gray-700">
              {(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB
            </div>
            
            <div className="text-sm text-gray-600 mt-2 mb-1">파일 형식</div>
            <div className="text-sm text-gray-700">{fileInfo.fileType}</div>
          </div>
        )}
        
        <p className="text-gray-600 mb-6">
          아래 입력창에 질문을 입력하시면 업로드한 파일의 내용을 분석하여 답변해드립니다.
        </p>
        
        <div className="text-sm text-gray-500">
          <div className="mb-2">💡 <strong>추천 질문:</strong></div>
          <ul className="text-left space-y-1">
            <li>• 이 데이터를 요약해주세요</li>
            <li>• 주요 인사이트가 무엇인가요?</li>
            <li>• 데이터를 차트로 시각화해주세요</li>
            <li>• 특정 조건으로 필터링해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUploadWelcomeMessage;