import { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Table, Tag, Space, Spin } from 'antd';
import {
  UserOutlined,
  RadarChartOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import { userService } from '../services/userService';
import { frequencyService } from '../services/frequencyService';
import { connectSocket, getSocket } from '../services/socketService';
import { formatNumber, formatDateTime } from '../utils/formatters';
import { useCountdown } from '../hooks/useCountdown';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeFrequencies: 0,
    privateFrequencies: 0,
    dailyActiveUsers: 0,
  });
  const [activeFrequencies, setActiveFrequencies] = useState([]);
  const [privateFrequencies, setPrivateFrequencies] = useState([]);
  const [dailyActiveData, setDailyActiveData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);


  // Socket connection and real-time dashboard stats
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect socket if not already connected
    if (!socketRef.current) {
      // TODO: Replace with actual token logic if needed
      socketRef.current = connectSocket();
    }
    const socket = socketRef.current;

    // Listen for dashboard stats updates
    socket.on('dashboard_stats', (data) => {
      setStats({
        totalUsers: data.totalUsers,
        activeFrequencies: data.activeFrequencies,
        privateFrequencies: data.privateFrequencies,
        dailyActiveUsers: data.dailyActiveUsers,
      });
    });

    return () => {
      if (socket) {
        socket.off('dashboard_stats');
      }
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        userStatsResponse,
        activeFreqResponse,
        privateFreqResponse,
        dailyActiveResponse,
        userGrowthResponse,
      ] = await Promise.all([
        userService.getUserStats(),
        frequencyService.getActiveFrequencies(),
        frequencyService.getPrivateFrequencies(),
        userService.getDailyActiveUsers(7),
        userService.getUserGrowth(30),
      ]);

      console.log('📊 API Responses:', {
        userStatsResponse,
        activeFreqResponse,
        privateFreqResponse,
        dailyActiveResponse,
        userGrowthResponse
      });

      // API already returns response.data from interceptor
      // Check if data is wrapped in { success, data } or direct
      const userStats = userStatsResponse?.data || userStatsResponse;
      const activeFreq = activeFreqResponse?.data || activeFreqResponse;
      const privateFreq = privateFreqResponse?.data || privateFreqResponse;
      const dailyActive = dailyActiveResponse?.data || dailyActiveResponse;
      const userGrowth = userGrowthResponse?.data || userGrowthResponse;

      console.log('📦 Extracted Data:', {
        userStats,
        activeFreq: Array.isArray(activeFreq) ? `Array[${activeFreq.length}]` : typeof activeFreq,
        privateFreq: Array.isArray(privateFreq) ? `Array[${privateFreq.length}]` : typeof privateFreq,
        dailyActive: Array.isArray(dailyActive) ? `Array[${dailyActive.length}]` : typeof dailyActive,
        userGrowth: Array.isArray(userGrowth) ? `Array[${userGrowth.length}]` : typeof userGrowth
      });

      setStats({
        totalUsers: userStats?.total || 0,
        activeFrequencies: Array.isArray(activeFreq) ? activeFreq.length : 0,
        privateFrequencies: Array.isArray(privateFreq) ? privateFreq.length : 0,
        dailyActiveUsers: userStats?.dailyActive || 0,
      });

      setActiveFrequencies(Array.isArray(activeFreq) ? activeFreq.slice(0, 5) : []);
      setPrivateFrequencies(Array.isArray(privateFreq) ? privateFreq.slice(0, 5) : []);
      setDailyActiveData(Array.isArray(dailyActive) ? dailyActive : []);
      setUserGrowthData(Array.isArray(userGrowth) ? userGrowth : []);
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const frequencyColumns = [
    {
      title: 'Frequency Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-medium">{name}</span>,
    },
    {
      title: 'Participants',
      dataIndex: 'participantCount',
      key: 'participantCount',
      render: (count) => (
        <Tag color="blue">
          <TeamOutlined /> {count}
        </Tag>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator) => creator?.name || 'Unknown',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDateTime(date),
    },
  ];

  const PrivateFrequencyTimer = ({ expiresAt }) => {
    const timeLeft = useCountdown(expiresAt);
    
    if (timeLeft.expired) {
      return <Tag color="red">Expired</Tag>;
    }

    return (
      <Tag color="green">
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </Tag>
    );
  };

  const privateFrequencyColumns = [
    {
      title: 'Frequency Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-medium">{name}</span>,
    },
    {
      title: 'Participants',
      dataIndex: 'participantCount',
      key: 'participantCount',
      render: (count) => (
        <Tag color="purple">
          <TeamOutlined /> {count}
        </Tag>
      ),
    },
    {
      title: 'Time Left',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (expiresAt) => <PrivateFrequencyTimer expiresAt={expiresAt} />,
    },
    {
      title: 'Created By',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator) => creator?.name || 'Unknown',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Users"
            value={formatNumber(stats.totalUsers)}
            icon={<UserOutlined />}
            trend="up"
            trendValue="+12%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Frequencies"
            value={formatNumber(stats.activeFrequencies)}
            icon={<RadarChartOutlined />}
            trend="up"
            trendValue="+5"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Private Frequencies"
            value={formatNumber(stats.privateFrequencies)}
            icon={<ClockCircleOutlined />}
            trend="down"
            trendValue="-2"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Daily Active Users"
            value={formatNumber(stats.dailyActiveUsers)}
            icon={<TeamOutlined />}
            trend="up"
            trendValue="+8%"
          />
        </Col>
      </Row>

      {/* Active Frequencies Table */}
      <Card title="Currently Active Frequencies" className="shadow-sm">
        <Table
          dataSource={activeFrequencies}
          columns={frequencyColumns}
          rowKey="_id"
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Private Frequencies Table */}
      <Card title="Active Private Frequencies" className="shadow-sm">
        <Table
          dataSource={privateFrequencies}
          columns={privateFrequencyColumns}
          rowKey="_id"
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Daily Active Users (Last 7 Days)" className="shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1890ff" name="Active Users" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="User Growth (Last 30 Days)" className="shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#52c41a" name="Total Users" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
