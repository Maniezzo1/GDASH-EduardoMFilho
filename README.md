# Full-Stack Weather Monitoring System

A complete weather monitoring system with AI insights, featuring Python data collection, Go worker processing, NestJS API, MongoDB storage, and React dashboard.

## Architecture

\`\`\`
Python Collector → RabbitMQ → Go Worker → NestJS API → MongoDB
                                              ↓
                                        React Dashboard
\`\`\`

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend API**: NestJS (TypeScript) + MongoDB
- **Queue Worker**: Go + RabbitMQ
- **Data Collector**: Python
- **Infrastructure**: Docker Compose

## Features

- Real-time weather data collection (Open-Meteo API)
- Message queue processing with RabbitMQ
- AI-powered weather insights
- User authentication (JWT)
- User CRUD operations
- CSV/XLSX data export
- Optional: PokéAPI integration with pagination
- Responsive dashboard with charts

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Go 1.21+ (for local development)

## Quick Start

1. Clone the repository
2. Copy environment files:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Start all services:
\`\`\`bash
docker-compose up --build
\`\`\`

4. Access the application:
   - Frontend: http://localhost:5173
   - NestJS API: http://localhost:3000
   - RabbitMQ Management: http://localhost:15672 (guest/guest)

5. Default login credentials:
   - Email: admin@example.com
   - Password: 123456

## Project Structure

\`\`\`
.
├── docker-compose.yml
├── .env.example
├── README.md
├── python-collector/          # Weather data collector
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   └── config.py
├── go-worker/                 # Queue consumer
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   └── main.go
├── nestjs-api/                # Backend API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── auth/
│       ├── users/
│       ├── weather/
│       └── pokemon/
└── react-frontend/            # Frontend dashboard
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        ├── pages/
        └── lib/
\`\`\`

## Services

### Python Collector
Collects weather data every hour from Open-Meteo API and sends to RabbitMQ.

### Go Worker
Consumes messages from RabbitMQ, validates data, and sends to NestJS API.

### NestJS API
Core backend with MongoDB, handles authentication, weather data, user CRUD, and exports.

### React Frontend
Modern dashboard with charts, tables, and AI insights.

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- GET `/api/auth/profile` - Get current user

### Users
- GET `/api/users` - List users
- POST `/api/users` - Create user
- PATCH `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

### Weather
- GET `/api/weather/logs` - List weather records
- POST `/api/weather/logs` - Create weather record (from Go worker)
- GET `/api/weather/insights` - Get AI insights
- GET `/api/weather/export/csv` - Export CSV
- GET `/api/weather/export/xlsx` - Export XLSX

### Pokemon (Optional)
- GET `/api/pokemon?page=1&limit=20` - List Pokemon
- GET `/api/pokemon/:id` - Get Pokemon details

## Environment Variables

See `.env.example` for all configuration options.

## Development

Run services individually for development:

\`\`\`bash
# Python collector
cd python-collector
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Go worker
cd go-worker
go run main.go

# NestJS API
cd nestjs-api
npm install
npm run start:dev

# React frontend
cd react-frontend
npm install
npm run dev
\`\`\`

## Testing

\`\`\`bash
# NestJS API tests
cd nestjs-api
npm run test

# Frontend tests
cd react-frontend
npm run test
\`\`\`

## License

MIT
