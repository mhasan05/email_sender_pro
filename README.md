# Email Sender Pro

A comprehensive email campaign management system built with Django REST Framework for the backend, React with Vite for the frontend, and a custom SMTP server for email handling. This application allows users to create, manage, and send email campaigns to subscribers, with features like user authentication, campaign scheduling, template management, and SMTP configuration.

## Features

- **User Authentication**: Secure login and registration using JWT tokens
- **Campaign Management**: Create and manage email campaigns with scheduling
- **Subscriber Management**: Import and organize subscriber lists with Excel support
- **Email Templates**: Design and save reusable email templates
- **SMTP Configuration**: Configure custom SMTP settings for email delivery
- **Dashboard**: Overview of campaign performance and statistics
- **Asynchronous Processing**: Celery-based task queue for efficient email sending
- **Docker Support**: Easy deployment with Docker Compose
- **Custom SMTP Server**: Built-in SMTP server for testing and development

## Tech Stack

### Backend
- **Django** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database
- **Redis** - Message broker and cache
- **Celery** - Asynchronous task queue
- **Gunicorn** - WSGI server

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Ant Design** - UI component library
- **React Query** - Data fetching and state management
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **aiosmtpd** - Custom SMTP server

## Prerequisites

- Docker and Docker Compose
- Node.js (for frontend development without Docker)
- Python 3.8+ (for backend development without Docker)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/email_sender_pro.git
   cd email_sender_pro
   ```

2. **Start the services with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Redis on port 6379
   - Django backend on port 8000
   - React frontend on port 3000 (if configured)
   - Celery worker
   - Custom SMTP server on port 8025

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - SMTP Server: localhost:8025

## Development Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd frontend
npm test
```

## Usage

1. **Register/Login**: Create an account or log in to access the dashboard
2. **Configure SMTP**: Set up your SMTP settings in the SMTP Config section
3. **Manage Subscribers**: Import subscriber lists using Excel files
4. **Create Templates**: Design email templates for your campaigns
5. **Create Campaigns**: Set up email campaigns with scheduling options
6. **Monitor Performance**: View campaign statistics on the dashboard

## API Documentation

The backend provides a REST API. Key endpoints include:

- `POST /api/auth/login/` - User authentication
- `GET /api/campaigns/` - List campaigns
- `POST /api/campaigns/` - Create campaign
- `GET /api/subscribers/` - List subscribers
- `POST /api/subscribers/import/` - Import subscribers from Excel

For detailed API documentation, visit http://localhost:8000/api/docs/ when the backend is running.

## Configuration

### Environment Variables

Create a `.env` file in the backend directory with:

```
DEBUG=1
SECRET_KEY=your_secret_key
DATABASE_URL=postgres://user:password@localhost:5432/email_sender
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### SMTP Settings

Configure SMTP in the application UI or via API:

- Host: smtp.gmail.com
- Port: 587
- Username: your_email@gmail.com
- Password: your_app_password

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@email-sender-pro.com or create an issue in this repository.

## Roadmap

- [ ] Email analytics and reporting
- [ ] A/B testing for campaigns
- [ ] Integration with email service providers (SendGrid, Mailgun)
- [ ] Mobile app companion
- [ ] Advanced segmentation features

---

Built with ❤️ using Django, React, and Docker