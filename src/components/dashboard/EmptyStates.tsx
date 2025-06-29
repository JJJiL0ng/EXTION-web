import React from 'react';
import Link from 'next/link';
import { MessageCircle, Table } from 'lucide-react';

export const GuestEmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">나만의 시트채팅을 시작해보세요</h3>
      <p className="text-gray-600 mb-6">로그인하시면 채팅 기록을 저장하고 언제든 다시 볼 수 있어요</p>
      <Link href="/login">
        <button className="bg-[#005de9] text-white px-6 py-3 rounded-lg hover:bg-[#005de9] transition-colors">
          로그인하고 시작하기
        </button>
      </Link>
    </div>
  );
};

export const NoChatsEmptyState: React.FC = () => {
  return (
    <div className="text-center py-24">
      <Table className="w-20 h-20 text-gray-300 mx-auto mb-6" />
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">아직 시트채팅이 없어요</h3>
      <p className="text-gray-600 mb-8 text-lg">첫 번째 시트채팅을 시작해보세요!</p>
      <Link href="/ai">
        <button className="bg-[#005de9] text-white px-8 py-4 rounded-lg hover:bg-[#005de9] transition-colors text-lg">
          새 시트채팅 시작하기
        </button>
      </Link>
    </div>
  );
}; 