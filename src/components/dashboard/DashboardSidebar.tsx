"use client";

import React from 'react';
import Link from 'next/link';
import { Home, Table, MessageCircle, MessageSquare, BookOpen, Zap, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';

interface DashboardSidebarProps {
  user: User | null;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ user }) => {
  const getUserInitial = (user: User | null): string => {
    if (!user) return 'G'; // Guest
    
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U'; // Unknown
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="Extion Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">Extion</h1>
                <p className="text-xs text-gray-500">AI Excel 도우미</p>
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="w-8 h-8 bg-[#005de9] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {getUserInitial(user)}
                </div>
              ) : (
                <Link href="/login">
                  <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-400 transition-colors">
                    <LogIn className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {!user && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              더 많은 기능을 이용하려면 로그인하세요
            </p>
            <Link href="/login">
              <button className="w-full bg-[#005de9] text-white text-sm py-2 px-3 rounded-lg hover:bg-[#005de9] transition-colors flex items-center justify-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>로그인</span>
              </button>
            </Link>
          </div>
        )}

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer bg-blue-50 text-[#005de9] border-r-2 border-[#005de9]"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">홈</span>
          </Link>
          <Link
            href="/ai"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <Table className="w-5 h-5" />
            <span className="font-medium">새 시트채팅 생성</span>
          </Link>
          <Link
            href="https://slashpage.com/extion-cs"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">기능 제안하기</span>
          </Link>
          <Link
            href="https://open.kakao.com/o/gB4EkaAh"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">커뮤니티</span>
          </Link>
          <Link
            href="/blog"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">블로그</span>
          </Link>
        </nav>

        <div className="mt-auto pt-8">
          <div className="bg-[#005de9] p-4 rounded-lg text-white">
            <div className="flex items-start space-x-2">
              <Zap className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Pro로 업그레이드 (준비중)</p>
                <p className="text-xs opacity-90 mt-1">고급 모델 사용 가능 <br /> 더 많은 기능 제공 <br /> 더 빠른 응답 시간</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar; 