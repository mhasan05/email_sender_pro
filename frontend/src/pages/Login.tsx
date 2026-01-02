import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form] = Form.useForm();

  const mutation = useMutation({
    mutationFn: (values: any) => api.post('auth/login/', values),
    onSuccess: (response) => {
      login(response.data.access, response.data.refresh);
      message.success('Login successful!');
      navigate('/');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Login failed');
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card style={{ width: 400 }}>
        <div className="text-center mb-6">
          <Title level={3}>Sign In</Title>
        </div>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
              Log in
            </Button>
          </Form.Item>
          
          <div className="text-center">
             Or <Link to="/register">register now!</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
