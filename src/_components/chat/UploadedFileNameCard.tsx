import React from 'react';
import { useSpreadsheetUploadStore } from '../../_store/sheet/spreadsheetUploadStore';
import { Eye } from 'lucide-react';

export const FileUploadCard: React.FC<{ showIcon?: boolean }> = ({
  showIcon = true,
}) => {
  const { isFileUploaded, uploadedFileName } = useSpreadsheetUploadStore();

  // 파일이 업로드되고 파일명이 있을 때만 표시
  if (!isFileUploaded || !uploadedFileName) {
    return null;
  }

  return (
    //현재 border 컬러가 적용이 안되는 에러가 있음 추후 확인해야함 : todo
    <div
      className="inline-flex items-center px-2 py-1 bg-white border border-[#005ed9] text-xs font-medium rounded-lg"
    >
      {showIcon && (
      <Eye size={16} className={`mr-1 text-gray-700`} />
      )}
      <span className={`text-gray-700`}>
      {uploadedFileName}
      </span>
    </div>
  );
};

export default FileUploadCard;