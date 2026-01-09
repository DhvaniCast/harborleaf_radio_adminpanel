import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  RadarChartOutlined,
  FlagOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const { Header, Sider, Content } = Layout;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/frequencies',
      icon: <RadarChartOutlined />,
      label: 'Frequencies',
    },
    {
      key: '/reports',
      icon: <FlagOutlined />,
      label: 'Reports',
    },
    {
      key: '/join-history',
      icon: <HistoryOutlined />,
      label: 'Join History',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) setCollapsed(true);
        }}
        className="shadow-lg"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1f1f1f', padding: '8px', marginTop: '16px' }}>
          {collapsed ? (
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={logo}
                alt="HL"
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
            </div>
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={logo}
                alt="HarborLeaf Radio"
                style={{ width: '56px', height: '56px', borderRadius: '50%' }}
              />
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: '16px' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: '#ffffff',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: '20px', cursor: 'pointer', color: '#1890ff' }}
                onClick={() => setCollapsed(!collapsed)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: '20px', cursor: 'pointer', color: '#1890ff' }}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#333333' }}>Welcome, {user?.name || 'Admin'}</span>
            <LogoutOutlined
              style={{ fontSize: '18px', cursor: 'pointer', color: '#ff4d4f' }}
              onClick={handleLogout}
              title="Logout"
            />
          </div>
        </Header>

        <Content style={{
          //   margin: '24px 16px',
          padding: 24,
          minHeight: 280,
          background: '#f0f2f5'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
