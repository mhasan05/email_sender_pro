import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Upload, message, Space, Drawer } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, UserAddOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const Subscribers: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  
  // Drawer state for viewing list details
  const [selectedList, setSelectedList] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add Subscriber Modal state
  const [isAddSubscriberModalOpen, setIsAddSubscriberModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<any>(null);
  const [addSubscriberForm] = Form.useForm();

  // Edit List state
  const [editingList, setEditingList] = useState<any>(null);

  // --- Queries ---

  const { data: lists, isLoading } = useQuery({
    queryKey: ['subscriberLists'],
    queryFn: () => api.get('campaigns/lists/').then((res) => res.data),
  });

  const { data: subscribers, isLoading: isSubscribersLoading } = useQuery({
    queryKey: ['subscribers', selectedList?.id],
    queryFn: () => api.get(`campaigns/subscribers/?list_id=${selectedList?.id}`).then((res) => res.data),
    enabled: !!selectedList?.id,
  });

  // --- Mutations ---

  const createListMutation = useMutation({
    mutationFn: (values: any) => {
        return api.post('campaigns/lists/', { name: values.name });
    },
    onSuccess: async (response) => {
      if (fileList.length > 0) {
          const listId = response.data.id;
          const formData = new FormData();
          formData.append('file', fileList[0].originFileObj);
          try {
            await api.post(`campaigns/lists/${listId}/upload/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            message.success('List created and subscribers imported');
          } catch (e) {
            message.error('List created but file upload failed');
          }
      } else {
          message.success('Subscriber list created');
      }
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['subscriberLists'] });
    },
    onError: () => {
      message.error('Failed to create list');
    },
  });

  const updateListMutation = useMutation({
    mutationFn: (values: any) => api.patch(`campaigns/lists/${editingList.id}/`, { name: values.name }),
    onSuccess: () => {
        message.success('List updated successfully');
        setIsModalOpen(false);
        setEditingList(null);
        form.resetFields();
        setFileList([]);
        queryClient.invalidateQueries({ queryKey: ['subscriberLists'] });
    },
    onError: () => {
        message.error('Failed to update list');
    }
  });

  const deleteListMutation = useMutation({
      mutationFn: (id: number) => api.delete(`campaigns/lists/${id}/`),
      onSuccess: () => {
          message.success('List deleted');
          queryClient.invalidateQueries({ queryKey: ['subscriberLists'] });
      }
  });

  const addSubscriberMutation = useMutation({
      mutationFn: (values: any) => api.post('campaigns/subscribers/', {
          ...values,
          subscriber_list: selectedList?.id
      }),
      onSuccess: () => {
          message.success('Subscriber added successfully');
          setIsAddSubscriberModalOpen(false);
          addSubscriberForm.resetFields();
          queryClient.invalidateQueries({ queryKey: ['subscribers', selectedList?.id] });
          queryClient.invalidateQueries({ queryKey: ['subscriberLists'] }); // Update counts
      },
      onError: (error: any) => {
          const errorMsg = error.response?.data?.email ? "Email already exists in this list" : "Failed to add subscriber";
          message.error(errorMsg);
      }
  });
  
  const updateSubscriberMutation = useMutation({
    mutationFn: (values: any) => api.patch(`campaigns/subscribers/${editingSubscriber.id}/`, values),
    onSuccess: () => {
        message.success('Subscriber updated successfully');
        setIsAddSubscriberModalOpen(false);
        setEditingSubscriber(null);
        addSubscriberForm.resetFields();
        queryClient.invalidateQueries({ queryKey: ['subscribers', selectedList?.id] });
    },
    onError: () => {
        message.error('Failed to update subscriber');
    }
  });
  
  const deleteSubscriberMutation = useMutation({
      mutationFn: (id: number) => api.delete(`campaigns/subscribers/${id}/`),
      onSuccess: () => {
          message.success('Subscriber removed');
          queryClient.invalidateQueries({ queryKey: ['subscribers', selectedList?.id] });
          queryClient.invalidateQueries({ queryKey: ['subscriberLists'] }); // Update counts
      }
  });

  // --- Handlers ---

  const uploadProps = {
    onRemove: (file: any) => {
      setFileList((prev) => {
        const index = prev.indexOf(file);
        const newFileList = prev.slice();
        newFileList.splice(index, 1);
        return newFileList;
      });
    },
    beforeUpload: (file: any) => {
      setFileList([file]); // Allow only 1 file
      return false;
    },
    fileList,
  };

  const handleDeleteList = (id: number) => {
      if(window.confirm("Are you sure you want to delete this list?")) {
          deleteListMutation.mutate(id);
      }
  };

  const handleCreateList = (values: any) => {
    if (editingList) {
      updateListMutation.mutate(values);
    } else {
      createListMutation.mutate(values);
    }
  };

  const handleEditList = (record: any) => {
    setEditingList(record);
    form.setFieldsValue({ name: record.name });
    setIsModalOpen(true);
  };

  const handleViewList = (record: any) => {
      setSelectedList(record);
      setIsDrawerOpen(true);
  };

  const handleAddSubscriber = (values: any) => {
      if (editingSubscriber) {
          updateSubscriberMutation.mutate(values);
      } else {
          addSubscriberMutation.mutate(values);
      }
  };
  
  const handleEditSubscriber = (record: any) => {
      setEditingSubscriber(record);
      addSubscriberForm.setFieldsValue(record);
      setIsAddSubscriberModalOpen(true);
  };

  const handleCloseSubscriberModal = () => {
      setIsAddSubscriberModalOpen(false);
      setEditingSubscriber(null);
      addSubscriberForm.resetFields();
  };
  
  const handleDeleteSubscriber = (id: number) => {
      if(window.confirm("Are you sure?")) {
          deleteSubscriberMutation.mutate(id);
      }
  };

  // --- Columns ---

  const listColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Subscribers',
      dataIndex: 'subscriber_count',
      key: 'subscriber_count',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handleViewList(record)}>View</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditList(record)}>Edit</Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteList(record.id)} />
        </Space>
      ),
    },
  ];

  const subscriberColumns = [
      {
          title: 'Email',
          dataIndex: 'email',
          key: 'email',
      },
      {
          title: 'First Name',
          dataIndex: 'first_name',
          key: 'first_name',
      },
      {
          title: 'Last Name',
          dataIndex: 'last_name',
          key: 'last_name',
      },
      {
          title: 'Actions',
          key: 'actions',
          render: (_: any, record: any) => (
              <Space>
                  <Button type="link" icon={<EditOutlined />} onClick={() => handleEditSubscriber(record)}>Edit</Button>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSubscriber(record.id)} />
              </Space>
          )
      }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscriber Lists</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Create New List
        </Button>
      </div>

      <Table columns={listColumns} dataSource={lists} rowKey="id" loading={isLoading} />

      {/* Create/Edit List Modal */}
      <Modal
        title={editingList ? "Edit Subscriber List" : "Create New Subscriber List"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingList(null);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateList}>
          <Form.Item
            name="name"
            label="List Name"
            rules={[{ required: true, message: 'Please enter list name' }]}
          >
            <Input />
          </Form.Item>

          {!editingList && (
            <Form.Item label="Import Subscribers (Excel/CSV)">
              <Upload {...uploadProps} accept=".csv,.xlsx,.xls">
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
              <div className="text-xs text-gray-500 mt-1">
                  Supported formats: .csv, .xlsx. Columns: email, first_name, last_name, etc.
              </div>
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createListMutation.isPending || updateListMutation.isPending} block>
              {editingList ? "Update List" : "Create & Import"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* View List / Manage Subscribers Drawer */}
      <Drawer
        title={selectedList ? `Manage: ${selectedList.name}` : 'List Details'}
        width={720}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
          <div className="flex justify-end mb-4">
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsAddSubscriberModalOpen(true)}>
                Add Subscriber
            </Button>
          </div>
          <Table 
            columns={subscriberColumns} 
            dataSource={subscribers} 
            rowKey="id" 
            loading={isSubscribersLoading}
            pagination={{ pageSize: 10 }}
          />
      </Drawer>

      {/* Add/Edit Single Subscriber Modal */}
      <Modal
        title={editingSubscriber ? "Edit Subscriber" : "Add Subscriber"}
        open={isAddSubscriberModalOpen}
        onCancel={handleCloseSubscriberModal}
        footer={null}
      >
          <Form form={addSubscriberForm} layout="vertical" onFinish={handleAddSubscriber}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                  <Input placeholder="john@example.com" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="first_name" label="First Name">
                    <Input placeholder="John" />
                </Form.Item>
                <Form.Item name="last_name" label="Last Name">
                    <Input placeholder="Doe" />
                </Form.Item>
              </div>
              <Form.Item>
                  <Button type="primary" htmlType="submit" loading={addSubscriberMutation.isPending || updateSubscriberMutation.isPending} block>
                      {editingSubscriber ? "Update Subscriber" : "Add Subscriber"}
                  </Button>
              </Form.Item>
          </Form>
      </Modal>
    </div>
  );
};

export default Subscribers;
