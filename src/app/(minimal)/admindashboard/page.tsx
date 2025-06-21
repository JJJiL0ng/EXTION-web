'use client'

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart3, 
  TrendingUp,
  Shield,
  Database,
  Clock,
  Server,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Upload,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    // 세션과 쿠키에서 로그인 상태 제거
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminLoggedIn');
      document.cookie = 'adminLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    
    // 어드민 게이트로 리다이렉션
    router.push('/admingate');
  };

  const stats = [
    {
      title: '총 사용자',
      value: '2,847',
      change: '+18%',
      icon: Users,
      color: 'bg-blue-500',
      trend: 'up'
    },
    {
      title: '활성 세션',
      value: '156',
      change: '+12%',
      icon: Activity,
      color: 'bg-green-500',
      trend: 'up'
    },
    {
      title: '생성된 파일',
      value: '12,394',
      change: '+31%',
      icon: FileText,
      color: 'bg-purple-500',
      trend: 'up'
    },
    {
      title: '서버 상태',
      value: '정상',
      change: '99.9%',
      icon: Shield,
      color: 'bg-emerald-500',
      trend: 'stable'
    }
  ];

  const recentUsers = [
    { id: 1, name: '김철수', email: 'kim@example.com', status: 'online', lastActive: '방금전' },
    { id: 2, name: '이영희', email: 'lee@example.com', status: 'offline', lastActive: '30분전' },
    { id: 3, name: '박민수', email: 'park@example.com', status: 'online', lastActive: '5분전' },
    { id: 4, name: '정수현', email: 'jung@example.com', status: 'away', lastActive: '1시간전' },
    { id: 5, name: '최은영', email: 'choi@example.com', status: 'online', lastActive: '방금전' }
  ];

  const systemMetrics = [
    { name: 'CPU 사용률', value: 45, status: 'good' },
    { name: '메모리 사용률', value: 72, status: 'warning' },
    { name: '디스크 사용률', value: 38, status: 'good' },
    { name: '네트워크 대역폭', value: 85, status: 'critical' }
  ];

  const recentFiles = [
    { name: '2024년_판매_데이터_분석.xlsx', size: '2.4MB', createdBy: '김철수', createdAt: '2시간전' },
    { name: '고객_만족도_조사_결과.xlsx', size: '1.8MB', createdBy: '이영희', createdAt: '4시간전' },
    { name: '재무_리포트_Q4.xlsx', size: '3.2MB', createdBy: '박민수', createdAt: '6시간전' },
    { name: '마케팅_캠페인_성과.xlsx', size: '1.5MB', createdBy: '정수현', createdAt: '8시간전' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.png" 
                alt="Extion Logo" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Extion Admin Dashboard</h1>
                <p className="text-sm text-gray-500">관리자 제어판</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
                             <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{currentTime.toLocaleString('ko-KR')}</span>
                </div>
                <button
                  onClick={() => router.push('/adminforpelisers')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>고급 관리</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="px-6 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

                 {/* 관리 기능 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 최근 사용자 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">최근 사용자</h3>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                전체보기
              </button>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      user.status === 'online' ? 'bg-green-500' : 
                      user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{user.lastActive}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 시스템 상태 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Server className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">시스템 상태</h3>
              </div>
              <RefreshCw className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
            <div className="space-y-4">
              {systemMetrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{metric.value}%</span>
                      {metric.status === 'good' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {metric.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {metric.status === 'critical' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.status === 'good' ? 'bg-green-500' : 
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 생성된 파일 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">최근 파일</h3>
              </div>
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                전체보기
              </button>
            </div>
            <div className="space-y-3">
              {recentFiles.map((file, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
                    <Download className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>{file.size} • {file.createdBy}</span>
                    <span>{file.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 빠른 액션 버튼들 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">빠른 관리 도구</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">사용자 관리</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Database className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">데이터 백업</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">통계 리포트</span>
            </button>
            <button 
              onClick={() => router.push('/adminforpelisers')}
              className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border-2 border-red-200"
            >
              <Shield className="w-8 h-8 text-red-600 mb-2" />
              <span className="text-sm font-medium text-red-900">고급 관리</span>
            </button>
          </div>
        </div>

                 {/* 최근 활동 및 실시간 모니터링 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 활동 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
              </div>
              <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">새로운 사용자 등록</p>
                  <p className="text-sm text-gray-600">김민수 (kim.minsu@company.co.kr)</p>
                  <span className="text-xs text-gray-500">3분 전</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">대용량 파일 업로드 완료</p>
                  <p className="text-sm text-gray-600">2024년_전사_재무데이터.xlsx (15.2MB)</p>
                  <span className="text-xs text-gray-500">8분 전</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <Database className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">자동 백업 완료</p>
                  <p className="text-sm text-gray-600">사용자 데이터 및 파일 백업 성공</p>
                  <span className="text-xs text-gray-500">15분 전</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">시스템 리소스 경고</p>
                  <p className="text-sm text-gray-600">메모리 사용률 80% 초과</p>
                  <span className="text-xs text-gray-500">22분 전</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <Globe className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">API 연동 성공</p>
                  <p className="text-sm text-gray-600">외부 데이터 소스 연결 완료</p>
                  <span className="text-xs text-gray-500">35분 전</span>
                </div>
              </div>
            </div>
          </div>

          {/* 실시간 통계 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">실시간 통계</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">LIVE</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">현재 접속자</span>
                  <span className="text-2xl font-bold text-blue-600">156</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">전일 대비 +12명</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-900">오늘 생성된 파일</span>
                  <span className="text-2xl font-bold text-green-600">47</span>
                </div>
                <p className="text-xs text-green-700 mt-1">평균 대비 +8개</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-900">API 호출 수</span>
                  <span className="text-2xl font-bold text-purple-600">2,834</span>
                </div>
                <p className="text-xs text-purple-700 mt-1">시간당 평균 314회</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-900">서버 응답시간</span>
                  <span className="text-2xl font-bold text-orange-600">124ms</span>
                </div>
                <p className="text-xs text-orange-700 mt-1">목표치 이하 유지</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => router.push('/adminforpelisers')}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">고급 관리 패널 접속</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
