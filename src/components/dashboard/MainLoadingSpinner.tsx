import React from 'react';

const MainLoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#005de9]"></div>
    </div>
  );
};

export default MainLoadingSpinner; 