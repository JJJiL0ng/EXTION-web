"use client";

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  return (
    <div className="text-center py-24">
      <Shield className="w-20 h-20 text-red-300 mx-auto mb-6" />
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">서버 연결 오류</h3>
      <p className="text-gray-600 mb-8 text-lg">{error}</p>
      <div className="space-x-6">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="bg-[#005de9] text-white px-8 py-4 rounded-lg hover:bg-[#005de9] transition-colors text-lg"
          >
            다시 시도
          </button>
        )}
        <Link href="/ai">
          <button className="bg-gray-600 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors text-lg">
            새 채팅 시작하기
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ErrorDisplay; 