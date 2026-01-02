import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';

const { Title } = Typography;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const mutation = useMutation({
    mutationFn: (values: any) => api.post('auth/register/', values),
    onSuccess: () => {
      message.success('Registration successful! Please login.');
      navigate('/login');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.username?.[0] || 'Registration failed');
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card style={{ width: 400 }}>
        <div className="text-center mb-6">
          <Title level={3}>Register</Title>
        </div>
        <Form
          form={form}
          name="register"
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
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
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
          
          <Form.Item
            name="first_name"
            label="First Name"
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="last_name"
            label="Last Name"
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
              Register
            </Button>
          </Form.Item>
           <div className="text-center">
             Already have an account? <Link to="/login">Login</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
