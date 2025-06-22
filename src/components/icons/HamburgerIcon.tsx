import React from 'react';

interface HamburgerIconProps {
  className?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

const HamburgerIcon: React.FC<HamburgerIconProps> = ({ 
  className = "w-6 h-6", 
  onClick,
  isOpen = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${className}`}
      aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
    >
      <svg
        className="w-5 h-5 text-gray-600 hover:text-gray-800 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
        />
      </svg>
    </button>
  );
};

export default HamburgerIcon; 