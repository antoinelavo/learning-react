'use client';

import { useState, useEffect } from 'react';
import { Eye, MousePointer, Smartphone, Monitor, TrendingUp, Calendar, Clock, Lock, LogOut } from 'lucide-react';

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // Check authentication status on component mount
  useEffect(() => {
    const authStatus = localStorage.getItem('hagwon_dashboard_auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Fetch dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    setDataLoading(true);
    setDataError('');
    
    try {
      // Fetch both stats and recent clicks in parallel
      const [statsResponse, recentClicksResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-clicks')
      ]);

      if (!statsResponse.ok) {
        throw new Error(`Stats API error! status: ${statsResponse.status}`);
      }
      
      if (!recentClicksResponse.ok) {
        throw new Error(`Recent clicks API error! status: ${recentClicksResponse.status}`);
      }

      const stats = await statsResponse.json();
      const recentClicks = await recentClicksResponse.json();
      
      console.log('Fetched stats:', stats); // Debug log
      console.log('Fetched recent clicks:', recentClicks.length, 'items'); // Debug log

      // Combine all the data
      setDashboardData({
        ...stats,
        recentClicks
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDataError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('hagwon_dashboard_auth', 'authenticated');
      setError('');
      setPassword('');
    } else {
      setError('잘못된 비밀번호입니다.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hagwon_dashboard_auth');
  };

  const colorClasses = {
    blue: {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: 'text-blue-600'
    },
    green: {
      text: 'text-green-600',
      bg: 'bg-green-50',
      icon: 'text-green-600'
    },
    purple: {
      text: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: 'text-purple-600'
    },
    orange: {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      icon: 'text-orange-600'
    },
    yellow: {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600'
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      icon: 'text-red-600'
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
    const colors = colorClasses[color] || colorClasses.blue;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
        </div>
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getButtonTypeLabel = (type) => {
    return type === 'homepage' ? '홈페이지' : '카카오톡';
  };

  const getDeviceIcon = (device) => {
    return device === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">학원 관리자 대시보드</h1>
              <p className="text-gray-600">접근하려면 비밀번호를 입력하세요.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none transition-colors font-medium"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard content (when authenticated)
  if (dataLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{dataError}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logout */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
            <p className="text-gray-600">실시간 클릭 데이터 및 분석</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchDashboardData}
              disabled={dataLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>새로고침</span>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="프로필 노출 인원 수"
            value={dashboardData.profileViews.toLocaleString()}
            icon={Eye}
            color="blue"
            subtitle="곧 추가 예정"
          />
          
          <StatCard
            title="홈페이지 버튼 클릭 수"
            value={dashboardData.buttonClicks.homepage}
            icon={MousePointer}
            color="green"
          />
          
          <StatCard
            title="카카오톡 버튼 클릭 수"
            value={dashboardData.buttonClicks.click}
            icon={MousePointer}
            color="purple"
          />
          
          <StatCard
            title="클릭율 (CTR)"
            value={`${dashboardData.ctr}%`}
            icon={TrendingUp}
            color="yellow"
          />
        </div>

          {/* Billing Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 hover:shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Homepage clicks billing */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">홈페이지 클릭</p>
                  <p className="text-lg font-bold text-green-700">{dashboardData.buttonClicks.homepage}회</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">₩2,000 × {dashboardData.buttonClicks.homepage}</p>
                  <p className="text-lg font-bold text-green-700">
                    ₩{(dashboardData.buttonClicks.homepage * 2000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* KakaoTalk clicks billing */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">카카오톡 클릭</p>
                  <p className="text-lg font-bold text-purple-700">{dashboardData.buttonClicks.click}회</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-700">
                  </p>
                </div>
              </div>
            </div>

            {/* Total billing summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">총 클릭 수</p>
                <p className="text-2xl font-bold text-gray-800 mb-1">
                  {dashboardData.buttonClicks.homepage + dashboardData.buttonClicks.click}회
                </p>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="text-sm text-gray-600">총 청구 금액</p>
                  <p className="text-xl font-bold text-gray-800">
                    ₩{((dashboardData.buttonClicks.homepage * 2000)).toLocaleString()} + 오픈채팅방 비용
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 m-0">
                  <strong>요금 안내:</strong> 홈페이지 클릭당 2,000원, 카카오톡 오픈채팅방 입장자 당 10,000원이 청구됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Device Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기기별 클릭 현황</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">모바일</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{dashboardData.deviceStats.mobile}</span>
                  <span className="text-sm text-gray-500 ml-1">클릭</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Monitor className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">컴퓨터</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-600">{dashboardData.deviceStats.desktop}</span>
                  <span className="text-sm text-gray-500 ml-1">클릭</span>
                </div>
              </div>
            </div>
            
            {/* Device percentage bars */}
            <div className="mt-6 space-y-3">
              {(dashboardData.deviceStats.mobile + dashboardData.deviceStats.desktop) > 0 ? (
                <>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>모바일</span>
                      <span>{((dashboardData.deviceStats.mobile / (dashboardData.deviceStats.mobile + dashboardData.deviceStats.desktop)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(dashboardData.deviceStats.mobile / (dashboardData.deviceStats.mobile + dashboardData.deviceStats.desktop)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>컴퓨터</span>
                      <span>{((dashboardData.deviceStats.desktop / (dashboardData.deviceStats.mobile + dashboardData.deviceStats.desktop)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-600 h-2 rounded-full" 
                        style={{ width: `${(dashboardData.deviceStats.desktop / (dashboardData.deviceStats.mobile + dashboardData.deviceStats.desktop)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>아직 클릭 데이터가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Button Click Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">버튼별 클릭 비교</h3>
            <div className="space-y-4">
              {(dashboardData.buttonClicks.homepage + dashboardData.buttonClicks.click) > 0 ? (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">홈페이지</span>
                      <span className="text-lg font-bold text-green-600">{dashboardData.buttonClicks.homepage}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full" 
                        style={{ width: `${(dashboardData.buttonClicks.homepage / (dashboardData.buttonClicks.homepage + dashboardData.buttonClicks.click)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {((dashboardData.buttonClicks.homepage / (dashboardData.buttonClicks.homepage + dashboardData.buttonClicks.click)) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">카카오톡</span>
                      <span className="text-lg font-bold text-purple-600">{dashboardData.buttonClicks.click}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full" 
                        style={{ width: `${(dashboardData.buttonClicks.click / (dashboardData.buttonClicks.homepage + dashboardData.buttonClicks.click)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {((dashboardData.buttonClicks.click / (dashboardData.buttonClicks.homepage + dashboardData.buttonClicks.click)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>아직 클릭 데이터가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Clicks Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">최근 클릭 활동</h3>
            <p className="text-sm text-gray-600 mt-1">클릭별 정확한 시간과 기기 정보</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">버튼 타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기기</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentClicks.length > 0 ? (
                  dashboardData.recentClicks.map((click) => {
                    const { date, time } = formatTimestamp(click.timestamp);
                    return (
                      <tr key={click.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            click.type === 'homepage' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {getButtonTypeLabel(click.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            {date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            {time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {getDeviceIcon(click.device)}
                            <span className="ml-2 capitalize">{click.device === 'mobile' ? '모바일' : '컴퓨터'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Clock className="w-8 h-8 text-gray-300 mb-2" />
                        <p>최근 클릭 기록이 없습니다</p>
                        <p className="text-sm text-gray-400 mt-1">클릭이 발생하면 여기에 표시됩니다</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;