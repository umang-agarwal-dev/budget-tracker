# Frontend

1. `npm install`
2. `copy .env.example .env.local` (Windows) or `cp .env.example .env.local`
3. `npm run dev` then open http://localhost:3000

The API must allow this address through CORS: on Render, `FRONTEND_URL` is `http://localhost:3000` while you develop.
When you deploy to Vercel, set `NEXT_PUBLIC_API_URL` there, then change `FRONTEND_URL` on Render to the Vercel address.
