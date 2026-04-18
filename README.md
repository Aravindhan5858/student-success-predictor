# Student Success Predictor

This project now uses a real database connection with a local `Express + SQLite` API.

## Run

- Install dependencies:

	`npm install`

- Run frontend + backend together:

	`npm run dev:full`

## API Server

- API base URL: `http://localhost:4000/api`
- Health check: `GET /api/health`
- Database file: `server/data.sqlite`

## Optional Frontend API URL

If needed, set a custom API URL using:

`VITE_API_URL=http://localhost:4000/api`
