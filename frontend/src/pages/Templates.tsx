import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const Templates: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('campaigns/templates/').then((res) => res.data),
  });

  const mutation = useMutation({
    mutationFn: (values: any) => {
      if (editingId) {
        return api.put(`campaigns/templates/${editingId}/`, values);
      }
      return api.post('campaigns/templates/', values);
    },
    onSuccess: () => {
      message.success(`Template ${editingId ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`campaigns/templates/${id}/`),
    onSuccess: () => {
      message.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleDateString() },
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
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>
          Create Template
        </Button>
      </div>

      <Table columns={columns} dataSource={templates} rowKey="id" loading={isLoading} />

      <Modal
        title={editingId ? "Edit Template" : "Create Template"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="html_content" label="HTML Content" rules={[{ required: true }]}>
            <Input.TextArea rows={10} placeholder="<html>...</html>" />
          </Form.Item>
          <div className="mb-4 text-gray-500 text-sm">
             Use placeholders like {"{{ first_name }}"}, {"{{ email }}"} in your HTML.
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending} block>
              Save Template
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Templates;
