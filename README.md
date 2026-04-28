# Student Success Predictor

Full-stack PWA — Next.js (App Router) + FastAPI + PostgreSQL + Cloudinary

## Roles
- **Admin** — system monitoring, user management, analytics
- **Professor** — CSV upload, student tracking, predictive insights
- **Student** — performance dashboard, assessments, mock interviews

## Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| Storage | Cloudinary |
| Auth | JWT (access + refresh tokens) |
| PWA | next-pwa, service worker |

## Quick Start

```bash
# Backend
cd backend && cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend && cp .env.example .env.local
npm install
npm run dev
```

## Docker

```bash
docker-compose up --build
```
