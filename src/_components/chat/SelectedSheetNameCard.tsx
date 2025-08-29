import React, { useState } from 'react';
import { Sheet, X, Check } from 'lucide-react';


export const SelectedSheetNameCard: React.FC<{
  showIcon?: boolean;
  spreadRef?: React.MutableRefObject<any> | React.RefObject<any> | null;
  fileName?: string;
  onRemove?: () => void;
  mode?: 'chatInputBox' | 'modal';
  isSelected?: boolean;
}> = ({
  showIcon = true,
  spreadRef: propSpreadRef,
  fileName,
  onRemove,
  mode,
  isSelected = false,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    // modal 모드에서는 isSelected prop을 사용, 그 외에는 local state 사용
    const [localClicked, setLocalClicked] = useState(false);
    const isClicked = mode === 'modal' ? isSelected : localClicked;

    // props로 받은 spreadRef가 있으면 우선 사용, 없으면 context에서 가져온 것 사용
    const spreadRef = propSpreadRef || null;

    if (!spreadRef) {
      console.error('No spreadRef provided');
      return null;
    }

    const handleClick = () => {
      if (mode === 'modal') {
        // modal 모드에서는 부모 컴포넌트의 onClick 핸들러가 처리
        return;
      } else {
        onRemove?.();
      }
    };

    return (
      //현재 border 컬러가 적용이 안되는 에러가 있음 추후 확인해야함 : todo
      <div
        className="inline-flex items-center px-2 py-1 bg-white border border-gray-300 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 relative h-[28px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* 호버 시 불투명한 오버레이 */}
        {(isHovered || (mode === 'modal' && isClicked)) && mode === 'chatInputBox' && (
        <div className="absolute inset-0 bg-gray-300 bg-opacity-60 rounded-lg" />
      )}
      {(isHovered || (mode === 'modal' && isClicked)) && mode === 'modal' && (
        <div className="absolute inset-0 bg-gray-300 bg-opacity-60 rounded-lg" />
      )}

        {/* 컨텐츠 영역 */}
        <div className="relative z-10 flex items-center">
            {showIcon && (
            mode === 'chatInputBox' && isHovered ? (
              <X size={16} className="mr-1 text-gray-400" />
            ) : mode === 'modal' && isClicked ? (
              <Check size={16} className="mr-1 text-gray-500" />
            ) : (
              <Sheet size={16} className="mr-1 text-gray-700" />
            )
            )}
          <span className={`${(isHovered && mode === 'chatInputBox') || (mode === 'modal' && isClicked) ? 'text-gray-400' : 'text-gray-700'}`}>
            {fileName}
          </span>
        </div>
      </div>
    );
  };

export default SelectedSheetNameCard;