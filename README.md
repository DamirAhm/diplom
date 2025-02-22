# Diplom Monorepo

This is a monorepo containing a Next.js frontend and Go backend applications.

## Project Structure

```
diplom/
├── packages/
│   ├── frontend/     # Next.js frontend application
│   └── backend/      # Go backend application
├── package.json      # Root package.json
└── README.md        # Documentation
```

## Requirements

- Node.js & Yarn for frontend
- Go 1.21+ for backend

## Getting Started

1. Install dependencies:
```bash
# Frontend dependencies
yarn install

# Backend dependencies
cd packages/backend && go mod download
```

2. Start development servers:

Frontend:
```bash
yarn dev:frontend
```

Backend:
```bash
yarn dev:backend
# or directly with Go
cd packages/backend && go run cmd/main.go
