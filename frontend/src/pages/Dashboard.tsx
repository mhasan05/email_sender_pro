import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { UserOutlined, MailOutlined, SendOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

const Dashboard: React.FC = () => {
  // Fetch stats from API (we need to implement a stats endpoint or just count from list endpoints)
  // For now we will mock or just fetch lists and count.
  
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: () => api.get('campaigns/').then(res => res.data) });
  const { data: lists } = useQuery({ queryKey: ['lists'], queryFn: () => api.get('campaigns/lists/').then(res => res.data) });
  
  // Calculate total subscribers?
  // We don't have a direct "all subscribers" count endpoint easily without fetching all lists.
  // But let's assume lists have a 'subscriber_count' field (I added it in serializer).
  
  const totalSubscribers = lists?.reduce((acc: number, list: any) => acc + list.subscriber_count, 0) || 0;
  const totalCampaigns = campaigns?.length || 0;
  const sentCampaigns = campaigns?.filter((c: any) => c.status === 'completed').length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Row gutter={16}>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Subscribers"
              value={totalSubscribers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Total Campaigns"
              value={totalCampaigns}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Campaigns Sent"
              value={sentCampaigns}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <p>Welcome to Email Sender Pro. Start by uploading subscribers and creating a campaign.</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
