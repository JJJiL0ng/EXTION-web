import React from 'react';
import Link from 'next/link';

const CTASection: React.FC = () => {
  return (
    <div className="mt-8 bg-gradient-to-r from-[#005de9] to-[#005de9] rounded-xl p-8 text-white text-center">
      <h3 className="text-2xl font-bold mb-2">복잡한 기능, 반복작업, 템플릿 걱정 없이</h3>
      <p className="text-blue-100 mb-6 text-lg">하고 싶은 걸 말하면 되는 Excel 경험을 시작해보세요</p>
      <Link href="/ai">
        <button className="bg-white text-[#005de9] px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
          로그인 없이 새 시트채팅 시작하기 →
        </button>
      </Link>
    </div>
  );
};

export default CTASection; 