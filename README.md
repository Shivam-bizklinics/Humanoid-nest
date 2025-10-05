# Humanoid NestJS Project

A NestJS application with TypeORM integration for PostgreSQL database.

## Features

- NestJS framework with TypeScript
- TypeORM integration with PostgreSQL
- Environment configuration with dotenv
- User entity with CRUD operations
- Database migrations support

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
```

## Database Setup

1. Create your PostgreSQL database
2. Run migrations:
```bash
npm run migration:run
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Endpoints

- `GET /` - Health check
- `GET /users` - Get all users
- `POST /users` - Create a new user

### Create User Example
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Database Migrations

```bash
# Generate a new migration
npm run migration:generate -- src/migrations/MigrationName

# Create a new migration file
npm run migration:create -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── shared/                    # Shared utilities and interfaces
│   ├── interfaces/           # Common interfaces
│   ├── dto/                 # Base DTOs
│   ├── exceptions/          # Custom exceptions
│   └── constants/           # Application constants
├── modules/                  # Feature modules
│   ├── authentication/      # User auth and JWT
│   ├── rbac/               # Role-based access control
│   ├── workspaces/         # Workspace management
│   ├── campaigns/          # Campaign management
│   ├── designer/           # Design creation and editing
│   ├── publisher/          # Content publishing
│   └── approval-workflow/  # Approval processes
├── database/                # Database configuration
├── migrations/              # Database migrations
├── app.module.ts           # Main application module
└── main.ts                 # Application entry point
```

## Module Overview

- **Authentication**: User registration, login, JWT management
- **RBAC**: Role and permission management
- **Workspaces**: Team collaboration spaces
- **Campaigns**: Marketing campaign lifecycle
- **Designer**: Design creation and management
- **Publisher**: Multi-platform content publishing
- **Approval Workflow**: Design and campaign approvals

## License

This project is licensed under the MIT License.