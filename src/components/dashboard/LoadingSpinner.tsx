import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "로딩 중..." 
}) => {
  return (
    <div className="text-center py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005de9] mx-auto"></div>
      <p className="text-gray-600 mt-6 text-lg">{message}</p>
    </div>
  );
};

export default LoadingSpinner; 