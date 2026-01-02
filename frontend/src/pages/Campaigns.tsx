import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Space, DatePicker, Checkbox } from 'antd';
import { PlusOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import dayjs from 'dayjs';

const Campaigns: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isScheduled, setIsScheduled] = useState(false);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('campaigns/').then((res) => res.data),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('campaigns/templates/').then((res) => res.data),
  });

  const { data: lists } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.get('campaigns/lists/').then((res) => res.data),
  });

  const { data: smtpConfigs } = useQuery({
    queryKey: ['smtpConfigs'],
    queryFn: () => api.get('campaigns/smtp/').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('campaigns/', values),
    onSuccess: () => {
      message.success('Campaign created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => api.post(`campaigns/${id}/send/`),
    onSuccess: () => {
      message.success('Campaign queued for sending');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
        message.error(error.response?.data?.error || "Failed to send campaign");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`campaigns/${id}/`),
    onSuccess: () => {
      message.success('Campaign deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: any) => {
        message.error(error.response?.data?.error || "Failed to delete campaign");
    }
  });

  const handleCreate = (values: any) => {
    // Convert scheduled_at to ISO string if it's a dayjs object
    if (values.scheduled_at) {
      values.scheduled_at = values.scheduled_at.toISOString();
    }
    createMutation.mutate(values);
  };

  const handleSend = (id: number) => {
      if (window.confirm("Are you sure you want to send this campaign now?")) {
          sendMutation.mutate(id);
      }
  };

  const handleDelete = (id: number) => {
      if (window.confirm("Are you sure you want to delete this campaign?")) {
          deleteMutation.mutate(id);
      }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
    { 
        title: 'Status', 
        dataIndex: 'status', 
        key: 'status',
        render: (status: string) => {
            let color = 'default';
            if (status === 'completed') color = 'success';
            if (status === 'processing') color = 'processing';
            if (status === 'failed') color = 'error';
            if (status === 'scheduled') color = 'blue';
            return <Tag color={color}>{status.toUpperCase()}</Tag>;
        }
    },
    { 
        title: 'Scheduled For', 
        dataIndex: 'scheduled_at', 
        key: 'scheduled_at',
        render: (text: string) => text ? new Date(text).toLocaleString() : '-'
    },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleDateString() },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
           {(record.status === 'draft' || record.status === 'scheduled') && (
               <Button type="primary" icon={<SendOutlined />} size="small" onClick={() => handleSend(record.id)}>
                   Send Now
               </Button>
           )}
           <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>
               Delete
           </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Create Campaign
        </Button>
      </div>

      <Table columns={columns} dataSource={campaigns} rowKey="id" loading={isLoading} />

      <Modal
        title="Create New Campaign"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setIsScheduled(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Campaign Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="subject" label="Email Subject" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="template" label="Template">
            <Select placeholder="Select a template">
                {templates?.map((t: any) => (
                    <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="subscriber_lists" label="Subscriber Lists" rules={[{ required: true }]}>
             <Select mode="multiple" placeholder="Select lists">
                {lists?.map((l: any) => (
                    <Select.Option key={l.id} value={l.id}>{l.name} ({l.subscriber_count})</Select.Option>
                ))}
             </Select>
          </Form.Item>

          <Form.Item name="smtp_config" label="Send via (SMTP Configuration)" rules={[{ required: true }]}>
             <Select placeholder="Select SMTP Configuration">
                {smtpConfigs?.map((s: any) => (
                    <Select.Option key={s.id} value={s.id}>{s.name} ({s.from_email})</Select.Option>
                ))}
             </Select>
          </Form.Item>

          <Form.Item>
            <Checkbox 
              checked={isScheduled} 
              onChange={(e) => {
                setIsScheduled(e.target.checked);
                if (!e.target.checked) {
                  form.setFieldsValue({ scheduled_at: undefined });
                }
              }}
            >
              Schedule this campaign for later
            </Checkbox>
          </Form.Item>

          {isScheduled && (
            <Form.Item 
              name="scheduled_at" 
              label="Schedule Date & Time" 
              rules={[{ required: true, message: 'Please select a date and time' }]}
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                placeholder="Select date and time"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending} block>
              {isScheduled ? 'Schedule Campaign' : 'Create & Send Now'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Campaigns;
