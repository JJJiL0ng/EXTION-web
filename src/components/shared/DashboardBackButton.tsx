'use client'
import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DashboardBackButton = () => {
  const router = useRouter();

  return (
    <div className="absolute top-6 left-6 group">
      <button 
        onClick={() => router.push('/dashboard')}
        className="w-12 h-12 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 flex items-center justify-center transition-all duration-200 group"
      >
        <LayoutDashboard className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
      </button>
      {/* 툴팁 */}
      <div className="absolute left-0 top-14 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        대시보드로 가기
        <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
      </div>
    </div>
  );
};

export default DashboardBackButton; 