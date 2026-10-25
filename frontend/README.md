# Frontend (React + Vite + TypeScript + Tailwind v4)

## Run locally
```bash
cd frontend
cp .env.example .env     # set VITE_API_URL to your backend, e.g. http://localhost:3000
pnpm install             # or npm install
pnpm dev                 # http://localhost:5173
```
The backend's CORS allow-list must include `http://localhost:5173`.

## Deploy to Vercel (Hobby/free)
1. Push the repo to GitHub. In Vercel: Add New Project, import the repo.
2. Set **Root Directory** to `frontend`. Framework preset: Vite (build `vite build`, output `dist`).
3. Add environment variable `VITE_API_URL` = your deployed backend URL (no trailing slash), then deploy.
4. Add the resulting `https://<project>.vercel.app` origin to the backend's CORS allow-list.

The frontend alone is static. The backend (Express + SQLite file) cannot run persistently on Vercel serverless, so host it elsewhere.

## Credits
- Fonts: Barlow and Barlow Condensed via `@fontsource` (SIL Open Font License 1.1)
- Icons: `lucide-react` (ISC license)
- No vehicle photos or illustrations are used.
