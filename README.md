# RampUP - AI-powered voice interviewer for hiring 💼

**🌍 Live Production URL**: [https://ramp-up-do29.vercel.app/](https://ramp-up-do29.vercel.app/)

RampUP is an open-source platform for companies to conduct AI-powered hiring interviews with their candidates. Now restructured for optimal scalability with a dedicated frontend and backend architecture.


## 🏗️ Architecture Overview

The project is split into two main services:
- **`/frontend`**: Next.js (TypeScript) application hosted on Vercel.
- **`/backend`**: FastAPI (Python) application hosted on Railway, featuring preloaded Whisper STT.
- **`.github/workflows`**: Automated CI/CD pipeline for build validation.

---

## 🚀 Local Development Setup

### 1. Clone the Project
```bash
git clone https://github.com/RampUP/RampUP.git
cd RampUP
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Fill in your `.env` with following:
- `OPENROUTER_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`

Start the backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Frontend Setup (Next.js)
```bash
cd ../frontend
npm install
cp .env.example .env.local
```
Fill in your `.env.local` with:
- `NEXT_PUBLIC_API_URL=http://localhost:8001`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Start the frontend:
```bash
npm run dev
```

---

## ☁️ Deployment Guide

### Backend → [Railway](https://railway.app/)
1. Create a new project on Railway from your GitHub repo.
2. Set the **Root Directory** to `backend`.
3. Railway will automatically detect the `railway.json` and `requirements.txt`.
4. Add your Environment Variables in the Railway Dashboard.

### Frontend → [Vercel](https://vercel.com/)
1. Import your repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Add `NEXT_PUBLIC_API_URL` pointing to your Railway backend URL.
4. Deploy!

---

## 🔄 CI/CD Pipeline
The included **GitHub Actions** (`.github/workflows/deploy.yml`) automatically validates your code on every push:
- Ensures the **Backend** installs and compiles correctly.
- Ensures the **Frontend** builds successfully.
- Prevents breaking changes from reaching production.

---

## 🔐 Environment Variables Summary

| Variable | Location | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Frontend | URL of your FastAPI backend |
| `OPENROUTER_API_KEY` | Backend | LLM provider for AI evaluation |
| `SUPABASE_URL` | Both | Your Supabase project URL |
| `SUPABASE_KEY` | Both | Your Supabase anon/service key |

---

## License
Licensed under the MIT License. Built with passion for open-source hiring tools.
