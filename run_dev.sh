#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
# pip install -r requirements.txt
python manage.py migrate
# Create superuser if not exists (simplified)
# python manage.py createsuperuser --noinput --username admin --email admin@example.com
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
# npm install
npm run dev &
FRONTEND_PID=$!

# Start Celery Worker
echo "Starting Celery Worker..."
cd ../backend
celery -A config worker -l info &
CELERY_PID=$!

echo "Application running."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID $CELERY_PID" SIGINT

wait
