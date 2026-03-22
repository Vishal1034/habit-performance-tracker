# Habit Stability Tracker

Track focus and distraction habits using a React dashboard, Node.js API, MongoDB, and a Chrome extension.

## Quick Start
1. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
2. Create env file:
   - Copy `server/.env.example` to `server/.env`
   - Set `MONGO_URI` and `JWT_SECRET`
   - Copy `client/.env.example` to `client/.env`
3. Run app:
   - Backend: `cd server && npm run dev`
   - Frontend: `cd client && npm start`
4. Open dashboard: `http://localhost:3000`

## Frontend API URL
- Local dev: `REACT_APP_API_BASE_URL=http://localhost:5000`
- Production (Vercel): set `REACT_APP_API_BASE_URL` to your deployed backend URL

## Security Before GitHub Push
1. Keep repo private if project is not public.
2. Do not commit `.env` files (already ignored).
3. Use strong `JWT_SECRET` and production `MONGO_URI`.
4. Set `ALLOWED_ORIGINS` in `server/.env` for your frontend domain.

## Main Folders
- `client`: React dashboard
- `server`: API and database logic
- `extension`: Chrome extension source
