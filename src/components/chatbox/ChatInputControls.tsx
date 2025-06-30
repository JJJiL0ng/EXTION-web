import React from 'react';
import { Plus, Search, Send } from 'lucide-react';

interface ChatInputControlsProps {
  inputValue: string;
  onSend: () => void;
  onUpload?: () => void;
  onSearch?: () => void;
  disabled?: boolean;
  className?: string;
}

const ChatInputControls: React.FC<ChatInputControlsProps> = ({
  inputValue,
  onSend,
  onUpload,
  onSearch,
  disabled = false,
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t border-gray-100 ${className}`}>
      <div className="flex items-center space-x-3">
        <button 
          onClick={onUpload}
          className="w-32 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
        >
          <Plus className="w-5 h-5 text-gray-600 mr-1" />
          <span className="text-sm text-gray-600">데이터 업로드</span>
        </button>
        
        <button 
          onClick={onSearch}
          className="w-24 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
        >
          <Search className="w-4 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">웹 검색</span>
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
  );
};

export default ChatInputControls; 