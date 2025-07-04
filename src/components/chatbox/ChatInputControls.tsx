import React, { useState, useRef } from 'react';
import { Paperclip, Send, Globe, X, FileText, Image, FileSpreadsheet } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface ChatInputControlsProps {
  inputValue: string;
  onSend: () => void;
  onUpload?: () => void;
  onSearch?: () => void;
  disabled?: boolean;
  className?: string;
  onFilesChange?: (files: UploadedFile[]) => void;
}

const ChatInputControls: React.FC<ChatInputControlsProps> = ({
  inputValue,
  onSend,
  onUpload,
  onSearch,
  disabled = false,
  className = "",
  onFilesChange
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
    if (onSearch) {
      onSearch();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = [
      // 이미지
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // 텍스트
      'text/plain', 'text/markdown', 'text/csv',
      // 문서
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // 스프레드시트
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      // 기타
      'application/json',
      'application/xml',
      'text/xml'
    ];

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const newFiles: UploadedFile[] = [];
    const rejectedFiles: string[] = [];
    
    Array.from(files).forEach(file => {
      // 파일 크기 체크
      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB - 크기 초과)`);
        return;
      }

      // 파일 타입 체크
      if (allowedTypes.includes(file.type) || 
          file.name.endsWith('.md') || 
          file.name.endsWith('.txt') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls')) {
        
        const uploadedFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          file: file
        };
        newFiles.push(uploadedFile);
      } else {
        rejectedFiles.push(`${file.name} (지원되지 않는 파일 형식)`);
      }
    });

    // 거부된 파일이 있으면 알림 표시
    if (rejectedFiles.length > 0) {
      alert(`다음 파일들을 업로드할 수 없습니다:\n\n${rejectedFiles.join('\n')}\n\n• 최대 파일 크기: 20MB\n• 지원 형식: 이미지, 텍스트, 문서, 스프레드시트 파일`);
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      
      if (onFilesChange) {
        onFilesChange(updatedFiles);
      }
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-3 h-3" />;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      return <FileSpreadsheet className="w-3 h-3" />;
    } else {
      return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className={`${className}`}>
      {/* 업로드된 파일 목록 - 입력창 위에 표시 */}
      {uploadedFiles.length > 0 && (
        <div className="px-6 py-2 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map(file => (
              <div 
                key={file.id}
                className="flex items-center bg-white border border-gray-200 rounded-md px-2 py-1 text-xs shadow-sm min-w-0"
              >
                <div className="text-gray-500 mr-2 flex-shrink-0">
                  {getFileIcon(file.name, file.type)}
                </div>
                <div className="flex-1 min-w-0 mr-2">
                  <div className="truncate font-medium text-gray-700 max-w-[120px]">
                    {file.name}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 컨트롤 영역 */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleFileUpload}
            className="w-20 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <Paperclip className="w-4 h-4 text-gray-600 mr-1" />
            <span className="text-sm text-gray-600">첨부</span>
          </button>
          
          <button 
            onClick={handleSearchToggle}
            className={`w-20 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ${
              isSearchActive 
                ? 'bg-blue-100 hover:bg-blue-200 border border-blue-300' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Globe className={`w-4 h-4 mr-1 ${
              isSearchActive ? 'text-blue-600' : 'text-gray-600'
            }`} />
            <span className={`text-sm ${
              isSearchActive ? 'text-blue-600' : 'text-gray-600'
            }`}>검색</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={onSend}
            disabled={!inputValue.trim() || disabled}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              inputValue.trim() && !disabled
                ? 'text-white shadow-sm' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            style={{ backgroundColor: inputValue.trim() && !disabled ? '#005ed9' : undefined }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.txt,.md,.csv,.xlsx,.xls,.pdf,.doc,.docx,.json,.xml"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ChatInputControls; 