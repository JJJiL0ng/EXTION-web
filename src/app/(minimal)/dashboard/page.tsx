"use client";

import React, { useState } from 'react';
import { Search, Bell, Plus, FileText, Table, BarChart3, Users, Calendar, Settings, Home, File, Folder, Download, MoreVertical, Grid3X3, List, Filter, MessageCircle, Mic, Zap, RefreshCw, Eye, Shield } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [viewMode, setViewMode] = useState('grid');

  const recentFiles = [
    { name: '매출 분석표_2025Q1', type: 'excel', status: '자동정리 완료', owner: '나', date: '2025. 6. 7', color: 'bg-blue-50 border-blue-200' },
    { name: '회의록_팀미팅_0607', type: 'excel', status: '템플릿 적용됨', owner: '나', date: '2025. 6. 7', color: 'bg-green-50 border-green-200' },
    { name: '고객 연락처 DB', type: 'excel', status: '중복 제거됨', owner: '나', date: '2025. 6. 6', color: 'bg-purple-50 border-purple-200' },
    { name: '재고 관리표', type: 'excel', status: '차트 생성됨', owner: '나', date: '2025. 6. 5', color: 'bg-orange-50 border-orange-200' },
    { name: '프로젝트 일정표', type: 'excel', status: '필터 적용됨', owner: '나', date: '2025. 6. 4', color: 'bg-indigo-50 border-indigo-200' },
    { name: '예산 계획서', type: 'excel', status: '수식 자동 삽입', owner: '나', date: '2025. 6. 3', color: 'bg-teal-50 border-teal-200' },
  ];

  const quickActions = [
    { 
      title: '자연어로 함수 요청', 
      subtitle: '"이 열에서 합계 구해줘"',
      icon: <MessageCircle className="w-6 h-6" />, 
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      accent: 'text-blue-600'
    },
    { 
      title: '음성으로 표 정리', 
      subtitle: '"정렬하고 중복 제거해줘"',
      icon: <Mic className="w-6 h-6" />, 
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      accent: 'text-purple-600'
    },
    { 
      title: '원클릭 자동화', 
      subtitle: '"매주 자동으로 정리해줘"',
      icon: <Zap className="w-6 h-6" />, 
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      accent: 'text-orange-600'
    },
    { 
      title: '안전 모드 미리보기', 
      subtitle: '"망가질까 걱정되니까 미리보기로"',
      icon: <Shield className="w-6 h-6" />, 
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      accent: 'text-green-600'
    },
  ];

  const templates = [
    { name: '빈 스프레드시트', icon: '📊', subtitle: '처음부터 시작' },
    { name: '매출 분석 템플릿', icon: '📈', subtitle: 'AI가 자동 맞춤' },
    { name: '회의록 양식', icon: '📝', subtitle: '말로 요청하면 포맷 변경' },
    { name: '고객 관리 DB', icon: '👥', subtitle: '중복 제거 자동화' },
    { name: '재고 관리표', icon: '📦', subtitle: '시각화 원클릭' },
    { name: '프로젝트 일정', icon: '📅', subtitle: '자연어로 수정' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Ex</span>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-lg">Extion</h1>
                  <p className="text-xs text-gray-500">AI Excel 도우미</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  U
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative mb-6">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="자연어로 검색해보세요"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <nav className="space-y-2">
            <div 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'home' ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab('home')}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">홈</span>
            </div>
            <div 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'chat' ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">AI 채팅</span>
            </div>
            <div 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'recent' ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab('recent')}
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-medium">자동화</span>
            </div>
            <div 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'templates' ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab('templates')}
            >
              <Table className="w-5 h-5" />
              <span className="font-medium">스마트 템플릿</span>
            </div>
          </nav>

          <div className="mt-8">
            <div className="flex items-center space-x-3 px-3 py-2">
              <Folder className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">내 파일</span>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg text-white">
              <div className="flex items-start space-x-2">
                <Zap className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Pro로 업그레이드(준비중)</p>
                  <p className="text-xs opacity-90 mt-1">무제한 AI 요청과 고급 자동화 기능</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">함수 몰라도 돼. 그냥 말만 해.</h1>
                <p className="text-lg text-gray-600">Extion이 당신의 엑셀 말을 알아듣는 AI 비서입니다</p>
              </div>
            </div>
          </div>

          {/* Feature Highlight */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✨ 이런 걸 할 수 있어요</h2>
            <div className="grid grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <div key={index} className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${action.color}`}>
                  <div className="text-center">
                    <div className={`${action.accent} mb-4 flex justify-center`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600 italic">{action.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 스마트 템플릿으로 시작하기</h2>
            <div className="grid grid-cols-6 gap-4">
              {templates.map((template, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all">
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-3 flex items-center justify-center text-2xl">
                    {template.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center mb-1">{template.name}</p>
                  <p className="text-xs text-gray-500 text-center">{template.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Files Section */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">🔥 최근 AI가 도와준 파일들</h2>
                <div className="flex items-center space-x-2">
                  <button className="text-sm text-gray-500 hover:text-gray-700">모든 파일 보기</button>
                  <Filter className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center space-x-1 ml-4">
                    <button 
                      className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button 
                      className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {viewMode === 'list' ? (
                <div className="space-y-3">
                  {recentFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Table className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{file.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {file.status}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{file.owner} • {file.date}</span>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-200 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-4">
                  {recentFiles.map((file, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 hover:shadow-md cursor-pointer transition-all ${file.color}`}>
                      <div className="w-full aspect-square bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3">
                        <Table className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate mb-2">{file.name}</p>
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {file.status}
                        </span>
                        <p className="text-xs text-gray-500">{file.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">복잡한 기능, 반복작업, 템플릿 걱정 없이</h3>
            <p className="text-blue-100 mb-6 text-lg">하고 싶은 걸 말하면 되는 Excel 경험을 시작해보세요</p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              지금 AI에게 말해보기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;