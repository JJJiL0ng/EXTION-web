import React, { useState } from 'react';
import { Sheet, X, Check , Layers} from 'lucide-react';

import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext";


export const SelectedSheetNameCard: React.FC<{
  showIcon?: boolean;
  fileName?: string;
  onRemove?: () => void;
  mode?: 'chatInputBox' | 'modal' | 'modal-whole-file' | 'modal-whole-data';
  isSelected?: boolean;
}> = ({
  showIcon = true,
  fileName,
  onRemove,
  mode,
  isSelected = false,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    // modal 모드에서는 isSelected prop을 사용, 그 외에는 local state 사용
  const [localClicked, setLocalClicked] = useState(false);
  const isClicked = (mode === 'modal' || mode === 'modal-whole-data' || mode === 'modal-whole-file') ? isSelected : localClicked;

    const spread = useSpreadsheetContext();

    if (!spread) {
      console.error('No spread context instance provided');
      return null;
    }

    const handleClick = () => {
      if (mode === 'modal' || mode === 'modal-whole-data' || mode === 'modal-whole-file') {
        // modal 모드에서는 부모 컴포넌트의 onClick 핸들러가 처리
        return;
      }

      if (mode === 'chatInputBox') {
        // chatInputBox 모드에서는 시트 변경 함수 실행
        handleChangeSheet();
        return;
      }

      // 기타 모드는 기존 onRemove 동작 유지
      onRemove?.();
    };

    const handleChangeSheet = () => {
      if (mode === 'chatInputBox') {
          spread.spread.setActiveSheet(fileName);
        return;
      } 
    };

    return (
      //현재 border 컬러가 적용이 안되는 에러가 있음 추후 확인해야함 : todo
      <div
        className="inline-flex items-center px-2 py-1 bg-white border hover:bg-gray-50 border-gray-300 text-xs font-medium rounded cursor-pointer transition-all duration-200 relative h-[28px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* 호버 시 불투명한 오버레이 */}
        {/* {(isHovered || (mode === 'modal' && isClicked)) && mode === 'chatInputBox' && (
        <div className="absolute inset-0 bg-gray-300 bg-opacity-60 rounded-lg" />
      )}
      {(isHovered || (mode === 'modal' && isClicked)) && mode === 'modal' && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-60 rounded-lg" />
      )} */}

        {/* 컨텐츠 영역 */}
        <div className="relative z-10 flex items-center">
            {showIcon && (
              // chatInputBox에서 hover 시 X 버튼
              (mode === 'chatInputBox' && isHovered) ? (
                <button
                  type="button"
                  aria-label="remove selected sheet"
                  title="Remove"
                  className="mr-1 text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.();
                  }}
                >
                  <X size={16} />
                </button>
              ) : (
                // modal 계열에서 선택 상태일 때는 체크, 아니면 기본 아이콘
                (mode === 'modal' || mode === 'modal-whole-data' || mode === 'modal-whole-file') && isClicked ? (
                  <Check size={16} className="mr-1 text-gray-500" />
                ) : (
                  // 기본 아이콘: modal-whole-* 에서는 Layers, 그 외 Sheet
                  (mode === 'modal-whole-data' || mode === 'modal-whole-file') ? (
                    <Layers size={16} className="mr-1 text-gray-700" />
                  ) : (
                    <Sheet size={16} className="mr-1 text-gray-700" />
                  )
                )
              )
            )}
          <span className={`${(isHovered && mode === 'chatInputBox') || (mode === 'modal' && isClicked) ? 'text-gray-700' : 'text-gray-700'}`}>
            {fileName}
          </span>
        </div>
      </div>
    );
  };

export default SelectedSheetNameCard;