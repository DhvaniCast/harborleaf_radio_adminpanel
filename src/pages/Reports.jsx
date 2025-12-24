import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Input, message, Row, Col, Statistic, Tabs } from 'antd';
import { 
  FlagOutlined, 
  UserOutlined, 
  RadarChartOutlined,
  EyeOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { getReports, getReportStats, updateReportStatus, deleteReport } from '../services/reportService';
import { formatDateTime } from '../utils/formatters';

const { TextArea } = Input;
const { confirm } = Modal;

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filter, pagination.current]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await getReports(params);
      
      if (response && response.data) {
        setReports(response.data.reports || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getReportStats();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await updateReportStatus(reportId, { 
        status: newStatus,
        adminNotes: adminNotes 
      });
      message.success('Report status updated successfully');
      fetchReports();
      fetchStats();
      setModalVisible(false);
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating report:', error);
      message.error('Failed to update report status');
    }
  };

  const handleDelete = (reportId) => {
    confirm({
      title: 'Are you sure you want to delete this report?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteReport(reportId);
          message.success('Report deleted successfully');
          fetchReports();
          fetchStats();
        } catch (error) {
          console.error('Error deleting report:', error);
          message.error('Failed to delete report');
        }
      },
    });
  };

  const showReportDetails = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    setModalVisible(true);
  };

  const getReasonLabel = (reason) => {
    const labels = {
      spam: 'Spam or Misleading',
      harassment: 'Harassment',
      inappropriate: 'Inappropriate Content',
      technical: 'Technical Issues',
      false_info: 'False Information',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'gold', icon: <ClockCircleOutlined /> },
      reviewing: { color: 'blue', icon: <EyeOutlined /> },
      resolved: { color: 'green', icon: <CheckCircleOutlined /> },
      dismissed: { color: 'default', icon: <CloseCircleOutlined /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.toUpperCase()}
      </Tag>
    );
  };

  const getReportTypeTag = (reportType) => {
    if (reportType === 'frequency') {
      return <Tag color="orange" icon={<RadarChartOutlined />}>FREQUENCY</Tag>;
    }
    return <Tag color="purple" icon={<UserOutlined />}>USER</Tag>;
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'reportType',
      key: 'reportType',
      width: 120,
      render: (type) => getReportTypeTag(type),
    },
    {
      title: 'Target',
      key: 'target',
      render: (_, record) => {
        if (record.reportType === 'frequency') {
          return (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
              <div className="font-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.frequencyName || 'Unknown'}</div>
              <div className="text-gray-500 text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.frequency} MHz</div>
            </div>
          );
        }
        return (
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
            <div className="font-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.reportedUser?.name || 'Unknown'}</div>
            <div className="text-gray-500 text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.reportedUser?.email || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      title: 'Reported By',
      key: 'reportedBy',
      render: (_, record) => (
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.reportedBy?.name || 'Unknown'}</div>
          <div className="text-gray-500 text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.reportedBy?.email}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: 110 }}>{formatDateTime(date)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ padding: 0, background: 'none', border: 'none', color: '#1677ff' }}
            onClick={() => showReportDetails(record)}
          >
            Review
          </Button>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            style={{ padding: 0, background: 'none', border: 'none', color: '#ff4d4f' }}
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: 'All Reports' },
    { key: 'pending', label: 'Pending' },
    { key: 'reviewing', label: 'Reviewing' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'dismissed', label: 'Dismissed' },
  ];


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports Management</h1>

      {/* Statistics */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Reports"
                value={stats.total || 0}
                prefix={<FlagOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Resolved"
                value={stats.resolved || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Resolution Rate"
                value={stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Reports Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ overflowX: 'auto' }}>
        <div style={{ marginLeft: 16, marginTop: 8, marginBottom: 16 }}>
          <Tabs
            activeKey={filter}
            onChange={setFilter}
            items={tabItems}
            className="mb-4"
            tabBarStyle={{ marginBottom: 0 }}
          />
        </div>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="_id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        title="Review Report"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedReport(null);
          setAdminNotes('');
        }}
        footer={null}
        width={window.innerWidth < 800 ? '98vw' : 700}
        style={window.innerWidth < 800 ? { top: 10, padding: 0 } : {}}
        bodyStyle={window.innerWidth < 800 ? { padding: 8 } : {}}
      >
        {selectedReport && (
          <div>
            {/* Report Type */}
            <div className="mb-4">
              {getReportTypeTag(selectedReport.reportType)}
            </div>

            {/* Target Info */}
            <Card title={selectedReport.reportType === 'frequency' ? 'Reported Frequency' : 'Reported User'} className="mb-4">
              {selectedReport.reportType === 'frequency' ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <RadarChartOutlined className="text-xl text-orange-500" />
                    <span className="font-medium text-lg">{selectedReport.frequencyName}</span>
                  </div>
                  <div className="text-gray-600">{selectedReport.frequency} MHz</div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <UserOutlined className="text-xl text-purple-500" />
                    <span className="font-medium text-lg">{selectedReport.reportedUser?.name}</span>
                  </div>
                  <div className="text-gray-600">{selectedReport.reportedUser?.email}</div>
                </div>
              )}
            </Card>

            {/* Reporter Info */}
            <Card title="Reported By" className="mb-4">
              <div>
                <div className="font-medium">{selectedReport.reportedBy?.name}</div>
                <div className="text-gray-600">{selectedReport.reportedBy?.email}</div>
              </div>
            </Card>

            {/* Report Details */}
            <Card title="Report Details" className="mb-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Reason: </span>
                  {getReasonLabel(selectedReport.reason)}
                </div>
                {selectedReport.details && (
                  <div>
                    <span className="font-medium">Details: </span>
                    {selectedReport.details}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status: </span>
                  {getStatusTag(selectedReport.status)}
                </div>
                <div>
                  <span className="font-medium">Reported On: </span>
                  {formatDateTime(selectedReport.createdAt)}
                </div>
              </div>
            </Card>

            {/* Admin Notes */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">Admin Notes</label>
              <TextArea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add your notes about this report..."
              />
            </div>

            {/* Action Buttons */}
            <Space className="w-full justify-end" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Button onClick={() => handleStatusChange(selectedReport._id, 'reviewing')}>
                Mark as Reviewing
              </Button>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(selectedReport._id, 'resolved')}
              >
                Resolve
              </Button>
              <Button 
                danger 
                icon={<CloseCircleOutlined />}
                onClick={() => handleStatusChange(selectedReport._id, 'dismissed')}
              >
                Dismiss
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
