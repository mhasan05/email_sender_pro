import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Checkbox, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const SMTPConfig: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['smtpConfigs'],
    queryFn: () => api.get('campaigns/smtp/').then((res) => res.data),
  });

  const mutation = useMutation({
    mutationFn: (values: any) => {
      if (editingId) {
        return api.put(`campaigns/smtp/${editingId}/`, values);
      }
      return api.post('campaigns/smtp/', values);
    },
    onSuccess: () => {
      message.success(`Configuration ${editingId ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['smtpConfigs'] });
    },
    onError: () => {
        message.error("Failed to save configuration");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`campaigns/smtp/${id}/`),
    onSuccess: () => {
      message.success('Configuration deleted');
      queryClient.invalidateQueries({ queryKey: ['smtpConfigs'] });
    },
  });

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Host', dataIndex: 'host', key: 'host' },
    { title: 'Port', dataIndex: 'port', key: 'port' },
    { title: 'From Email', dataIndex: 'from_email', key: 'from_email' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SMTP Configurations</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>
          Add New Configuration
        </Button>
      </div>

      <Table columns={columns} dataSource={configs} rowKey="id" loading={isLoading} />

      <Modal
        title={editingId ? "Edit SMTP Configuration" : "Add SMTP Configuration"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)} initialValues={{ port: 587, use_tls: true, use_ssl: false }}>
          <Form.Item name="name" label="Config Name" rules={[{ required: true }]} help="Friendly name e.g. 'Gmail Personal'">
            <Input />
          </Form.Item>
          
          <Form.Item name="host" label="SMTP Host" rules={[{ required: true }]}>
            <Input placeholder="smtp.gmail.com" />
          </Form.Item>

          <Form.Item name="port" label="Port" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>

          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: !editingId }]}>
            <Input.Password placeholder={editingId ? "Leave blank to keep unchanged" : ""} />
          </Form.Item>

          <Form.Item name="from_email" label="From Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item name="use_tls" valuePropName="checked">
            <Checkbox>Use TLS</Checkbox>
          </Form.Item>

          <Form.Item name="use_ssl" valuePropName="checked">
            <Checkbox>Use SSL</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending} block>
              Save Configuration
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SMTPConfig;
