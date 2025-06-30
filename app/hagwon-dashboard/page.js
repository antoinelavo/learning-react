'use client';

import { useState } from 'react';
import { Eye, MousePointer, Smartphone, Monitor, TrendingUp, Calendar, Clock } from 'lucide-react';

const Dashboard = () => {
  // Mock data - replace with actual data from your API
  const [dashboardData] = useState({
    profileViews: 310,
    buttonClicks: {
      homepage: 21,
      click: 4
    },
    ctr: ((21+4)/310 *100).toFixed(2),
    recentClicks: [
      { id: 1, type: 'homepage', timestamp: '2025-06-30 14:30:25', device: 'mobile' },
      { id: 2, type: 'click', timestamp: '2025-06-30 14:28:15', device: 'desktop' },
      { id: 3, type: 'homepage', timestamp: '2025-06-30 14:25:10', device: 'mobile' },
      { id: 4, type: 'click', timestamp: '2025-06-30 14:22:45', device: 'desktop' },
      { id: 5, type: 'click', timestamp: '2025-06-30 14:20:30', device: 'mobile' },
      { id: 6, type: 'homepage', timestamp: '2025-06-30 14:18:20', device: 'desktop' },
      { id: 7, type: 'click', timestamp: '2025-06-30 14:15:10', device: 'mobile' },
      { id: 8, type: 'homepage', timestamp: '2025-06-30 14:12:55', device: 'desktop' }
    ],
    deviceStats: {
      mobile: 16,
      desktop: 11
    }
  });

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="프로필 노출 인원 수"
            value={dashboardData.profileViews.toLocaleString()}
            icon={Eye}
            color="blue"
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
                  <p className="text-sm text-purple-600">₩10,000 × {dashboardData.buttonClicks.click}</p>
                  <p className="text-lg font-bold text-purple-700">
                    ₩{(dashboardData.buttonClicks.click * 10000).toLocaleString()}
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
                    ₩{((dashboardData.buttonClicks.click * 10000) + (dashboardData.buttonClicks.homepage * 2000)).toLocaleString()}
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
                  <strong>요금 안내:</strong> 홈페이지 클릭은 클릭당 2,000원, 카카오톡 클릭은 클릭당 10,000원이 청구됩니다.
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
            </div>
          </div>

          {/* Button Click Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">버튼별 클릭 비교</h3>
            <div className="space-y-4">
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
                {dashboardData.recentClicks.map((click) => {
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;