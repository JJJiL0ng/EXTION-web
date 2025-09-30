// components/Resizer.tsx
interface ResizerProps {
  onMouseDown: () => void;
  isResizing: boolean;
}

export const Resizer = ({ onMouseDown, isResizing }: ResizerProps) => {
  return (
    <div
      className={`
        w-1 bg-gray-300 hover:bg-[#005de9] cursor-col-resize
        transition-colors duration-200 flex-shrink-0
        ${isResizing ? 'bg-[#005de9]' : ''}
      `}
      onMouseDown={onMouseDown}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className={`
          w-0.5 h-8 rounded transition-colors duration-200
          ${isResizing ? 'bg-white' : 'bg-gray-500 hover:bg-white'}
        `}></div>
      </div>
    </div>
  );
};