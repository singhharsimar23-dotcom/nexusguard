# Pioneer Finance Deployment Guide (Antigravity)

## Environment Variables
Ensure the following are set in the AI Studio Secrets panel:
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `APP_URL`: Automatically injected by the platform.

## Build & Start
The application is configured to run as a full-stack Express + Vite app.
- **Build**: `npm run build`
- **Start**: `npm start` (which runs `node server.ts` or `tsx server.ts` in dev)

## WebSocket Configuration
The WebSocket server runs on the same port (3000) as the Express server. The platform's nginx proxy handles the upgrade automatically.

## Persistence
The application uses `better-sqlite3` with a local file `pioneer.db`. In the preview environment, this file persists across restarts within the same session.
