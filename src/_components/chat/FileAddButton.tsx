import React from "react"
import { Plus } from "lucide-react"

interface FileAddButtonProps {
  isSelected: boolean;
  onClick?: () => void;
}

const FileAddButton: React.FC<FileAddButtonProps> = ({ isSelected, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="inline-flex items-center px-2 py-1 bg-white border border-gray-300 text-xs font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors h-[28px]"
    >
      <Plus size={16} className={isSelected ? "" : "mr-1"} />
      {!isSelected && <span className="mr-1">파일 추가</span>}
    </button>
  )
}

export default FileAddButton


