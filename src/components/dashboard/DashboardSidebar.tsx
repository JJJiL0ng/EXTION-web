"use client";

import React from 'react';
import Link from 'next/link';
import { Home, MessageSquare, BookOpen, Zap, LogIn, FileSpreadsheet, Lightbulb, Users, Upload } from 'lucide-react';
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
    <div className="w-64 bg-white shadow-sm border-r h-screen flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="Extion Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">Extion</h1>
                <p className="text-xs text-gray-500">AI Excel 어시스턴트</p>
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
        
        {/* Login Prompt for Non-users */}
        {!user && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              로그인하면 채팅 기록을 저장하고 <br /> 언제든 다시 볼 수 있어요
            </p>
            <Link href="/login">
              <button className="w-full bg-[#005de9] text-white text-sm py-2 px-3 rounded-lg hover:bg-[#005de9] transition-colors flex items-center justify-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>로그인</span>
              </button>
            </Link>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-2 flex-1">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer bg-blue-50 text-[#005de9] border-r-2 border-[#005de9]"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">홈</span>
          </Link>
          
          <div className="border-b border-gray-200 my-2"></div>
         
          <Link
            href="/chat"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">채팅으로 시트 생성</span>
          </Link>
          <Link
            href="/fileupload"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">기존 엑셀 파일 업로드</span>
          </Link>
          <Link
            href="/ai"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="font-medium">빈 작업시트 생성 </span>
          </Link>

          <div className="border-b border-gray-200 my-2"></div>

          <Link
            href="https://slashpage.com/extion-cs"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <Lightbulb className="w-5 h-5" />
            <span className="font-medium">엑션에 대해 피드백</span>
          </Link>
          <Link
            href="https://open.kakao.com/o/gB4EkaAh"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">커뮤니티</span>
          </Link>
          <Link
            href="/blog"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">블로그</span>
          </Link>
          <div className="border-b border-gray-200 my-2"></div>
        </nav>

        {/* CTA Section */}
        <div className="mt-4">
          <Link href="https://slashpage.com/extion-cs">
            <button className="w-full bg-[#005de9] p-4 rounded-lg text-white transition-all hover:bg-[#004bc1] hover:shadow-lg">
              <div className="flex items-start space-x-2">
                <Zap className="w-6 h-6 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Extion의 새로운 기능 제안</p>
                  <p className="text-xs opacity-90 mt-1">혁신적인 기능들을 제안하여 <br /> 엑션의 발전에 기여해주세요</p>
                </div>
              </div>
            </button>
          </Link>
        </div>
      </div>
      
      {/* Footer 정보 - 최하단 고정 */}
      <div className="p-4 pt-2 border-t">
        <div className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Extion by Pelisers
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar; 