'use client'
import React, { useState, useEffect } from 'react';
import { Clock, Pen, Star, ArrowRight } from 'lucide-react';

const BlogComingSoon = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        
        {/* 메인 아이콘 */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Pen className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* 메인 타이틀 */}
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
          블로그는 현재 준비중입니다
        </h2>
        
        {/* 서브 타이틀 */}
        <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
          더 나은 콘텐츠로 여러분을 만나기 위해<br />
          열심히 준비하고 있습니다
        </p>

        {/* 진행 상황 표시 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-gray-700 font-medium">진행 상황</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div className="bg-blue-600 h-3 rounded-full transition-all duration-2000 ease-out" style={{ width: '75%' }}></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mb-2"></div>
              <span className="text-gray-600">디자인</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mb-2"></div>
              <span className="text-gray-600">개발</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mb-2"></div>
              <span className="text-gray-400">콘텐츠</span>
            </div>
          </div>
        </div>

        {/* 예상 오픈 일정 */}
        <div className="bg-blue-600 text-white rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-2">예상 오픈 일정</h3>
          <p className="text-blue-100 mb-4">2025년 여름 중 오픈 예정</p>
          <div className="flex justify-center">
            <div className="bg-white bg-opacity-20 rounded-full px-4 py-2 flex items-center">
              <span className="text-sm font-medium">곧 만나요!</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>

        {/* 알림 신청 */}
        {/* <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            오픈 소식을 가장 먼저 받아보세요
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap">
              알림 신청
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            스팸 메일은 발송하지 않으며, 언제든지 구독을 취소할 수 있습니다.
          </p>
        </div> */}

        {/* 푸터 */}
        <div className="mt-12 text-gray-500 text-sm">
          <p>© 2025 Extion의 Blog. 훌륭한 콘텐츠로 찾아뵙겠습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default BlogComingSoon;