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
  ExternalLink,
  X,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  isAdminLoggedIn, 
  adminLogout, 
  fetchAllUsers, 
  fetchAllChats, 
  fetchSystemStats,
  fetchUserChats,
  fetchChatMessages
} from '@/services/admin/adminApiUtils';
import { loadAdminChatSheetData } from '@/services/admin/adminSheetchatApiUtils';
import { useAdminStore, type AdminChat, type AdminUser } from '@/stores/adminStore';


// 타입 정의
interface User {
  id?: string;
  uid?: string;
  email: string;
  displayName?: string;
  display_name?: string;
  isOnline?: boolean;
  status?: string;
  lastLoginAt?: string;
  created_at?: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  status: string;
  lastActive: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  lastUpdated: string;
  messageCount?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalChats: 0,
    serverStatus: '정상'
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  
  // Admin Store 사용
  const {
    allUsers,
    selectedUser,
    userChats,
    loading,
    modalLoading,
    error,
    modalError,
    setAllUsers,
    setSelectedUser,
    setUserChats,
    setLoading,
    setModalLoading,
    setError,
    setModalError,
    setSelectedChatId,
    clearErrors
  } = useAdminStore();
  
  // 기존 상태들 (adminStore로 대체되지 않은 것들)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  // 인증 상태 확인 및 데이터 로드
  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.push('/admingate');
      return;
    }

    loadDashboardData();
  }, [router]);

  // 시계 업데이트 (클라이언트에서만)
  useEffect(() => {
    // 초기 시간 설정
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedUser) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [selectedUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      clearErrors();

      // 병렬로 데이터 가져오기
      const [usersData, chatsData] = await Promise.all([
        fetchAllUsers().catch(() => [] as User[]),
        fetchAllChats().catch(() => [])
      ]);

      // 통계 데이터 업데이트
      setStats({
        totalUsers: usersData.length || 0,
        activeSessions: usersData.filter((user: User) => user.isOnline || user.status === 'online').length || 0,
        totalChats: chatsData.length || 0,
        serverStatus: '정상'
      });

      // 사용자 데이터 정렬 및 포맷팅
      const sortedUsersData = usersData
        .sort((a: User, b: User) => {
          const aTime = new Date(b.lastLoginAt || b.created_at || 0).getTime();
          const bTime = new Date(a.lastLoginAt || a.created_at || 0).getTime();
          return aTime - bTime;
        })
        .map((user: User): RecentUser => ({
          id: user.id || user.uid || '',
          name: user.displayName || user.display_name || user.email.split('@')[0],
          email: user.email,
          status: user.isOnline ? 'online' : 'offline',
          lastActive: formatLastActive(user.lastLoginAt || user.created_at)
        }));

      // 전체 사용자 데이터 저장 (AdminUser 타입으로 변환)
      const adminUsersData: AdminUser[] = sortedUsersData.map((user: RecentUser) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        lastActive: user.lastActive
      }));
      setAllUsers(adminUsersData);
      
      // 최근 사용자 데이터 (최대 6명)
      const recentUsersData = sortedUsersData.slice(0, 6);
      setRecentUsers(recentUsersData);
    } catch (err) {
      console.error('대시보드 데이터 로드 오류:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatLastActive = (timestamp: string | undefined): string => {
    if (!timestamp) return '알 수 없음';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금전';
    if (diffInMinutes < 60) return `${diffInMinutes}분전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간전`;
    return `${Math.floor(diffInMinutes / 1440)}일전`;
  };

  const handleLogout = () => {
    adminLogout();
    router.push('/admingate');
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // 사용자 채팅 목록 불러오기
  const handleUserClick = async (user: RecentUser) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      lastActive: user.lastActive
    });
    setModalLoading(true);
    setModalError('');
    setUserChats([]);
    setChatMessages([]);
    setSelectedChat(null);

    try {
      const chats = await fetchUserChats(user.id);
      const formattedChats: AdminChat[] = chats.map((chat: any) => ({
        chatId: chat.chatId || chat.id,
        title: chat.title || '제목 없음',
        createdAt: chat.createdAt || chat.created_at,
        lastUpdated: chat.lastUpdated || chat.updated_at || chat.createdAt || chat.created_at,
        messageCount: chat.messageCount || 0,
        sheetMetaDataId: chat.sheetMetaDataId,
        status: chat.status || 'ACTIVE',
        userId: chat.userId || user.id,
        userDisplayName: chat.userDisplayName || user.name,
        userEmail: chat.userEmail || user.email
      }));
      setUserChats(formattedChats);
    } catch (err) {
      console.error('사용자 채팅 로드 오류:', err);
      setModalError('채팅 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setModalLoading(false);
    }
  };

  // 채팅 선택 시 관리 페이지로 이동
  const handleChatClick = (chat: AdminChat) => {
    const chatId = chat.chatId || chat.id;
    if (chatId) {
      setSelectedChatId(chatId);
      // sessionStorage에서 adminUserId 가져오기
      const adminUserId = sessionStorage.getItem('adminUserId');
      const queryParams = adminUserId ? `?adminUserId=${adminUserId}` : '';
      router.push(`/adminsheetchat/${chatId}${queryParams}`);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedUser(null);
    setUserChats([]);
    setChatMessages([]);
    setSelectedChat(null);
    setModalError('');
    setSelectedChatId(null);
  };

  // 메시지 시간 포맷팅
  const formatMessageTime = (timestamp: string | Date): string => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString('ko-KR');
    } catch {
      return timestamp.toString();
    }
  };

  const dashboardStats = [
    {
      title: '총 사용자',
      value: loading ? '...' : stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: '활성 세션',
      value: loading ? '...' : stats.activeSessions.toString(),
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: '총 채팅',
      value: loading ? '...' : stats.totalChats.toLocaleString(),
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      title: '서버 상태',
      value: stats.serverStatus,
      icon: Shield,
      color: 'bg-emerald-500'
    }
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
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span suppressHydrationWarning>
                  {currentTime ? currentTime.toLocaleString('ko-KR') : '시간 로딩 중...'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
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
      </header>

      {/* 메인 콘텐츠 */}
      <main className="px-6 py-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 최근 사용자 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          {/* 최근 사용자 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {showAllUsers ? '전체 사용자' : '최근 가입 사용자'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showAllUsers ? '최근 사용자만 보기' : '전체 사용자 보기'}
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => router.push('/adminforpelisers')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  고급 관리
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">사용자 데이터를 불러오는 중...</p>
                </div>
              ) : (showAllUsers ? allUsers : recentUsers).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(showAllUsers ? allUsers : recentUsers).map((user: AdminUser | RecentUser) => (
                    <div 
                      key={user.id} 
                      onClick={() => handleUserClick(user)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
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
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{user.lastActive}</span>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">사용자 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 고급 관리 패널 바로가기 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-semibold text-gray-900">고급 관리 시스템</h3>
            </div>
            <p className="text-gray-600 mb-6">
              전체 사용자 관리, 채팅 데이터 조회, 시스템 모니터링 등 상세한 관리 기능을 사용하려면 고급 관리 패널로 이동하세요.
            </p>
            <button 
              onClick={() => router.push('/adminforpelisers')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-lg font-medium"
            >
              <Shield className="w-6 h-6" />
              <span>고급 관리 패널 접속</span>
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* 사용자 채팅 모달 */}
      {selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedUser.name}의 채팅 목록</h2>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* 채팅 목록 */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{modalError}</p>
                </div>
              )}

              {modalLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">채팅 목록을 불러오는 중...</p>
                </div>
              ) : userChats.length > 0 ? (
                <div className="space-y-3">
                  {userChats.map((chat: AdminChat) => (
                    <div
                      key={chat.chatId || chat.id}
                      onClick={() => handleChatClick(chat)}
                      className="p-4 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:bg-gray-50 hover:border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-base truncate">
                            {chat.title}
                          </h4>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {formatMessageTime(chat.createdAt)}
                              </span>
                            </div>
                            {chat.messageCount && (
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  {chat.messageCount}개 메시지
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            보기
                          </span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-lg">채팅이 없습니다.</p>
                  <p className="text-gray-400 text-sm mt-1">이 사용자는 아직 채팅을 시작하지 않았습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
