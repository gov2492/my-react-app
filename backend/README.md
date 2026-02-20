# Spring Boot Microservices Backend

This backend now has 4 services:

1. `auth-service` (`http://localhost:8083`) - user registration/login and JWT token issuing
2. `invoice-service` (`http://localhost:8081`) - invoice and overview data (PostgreSQL + JPA)
3. `market-service` (`http://localhost:8082`) - market data, sales categories, stock alerts (PostgreSQL + JPA)
4. `dashboard-service` (`http://localhost:8080`) - secured aggregator for frontend endpoint `/api/dashboard/overview`

## Security model

- `auth-service` issues signed JWT tokens.
- `invoice-service`, `market-service`, and `dashboard-service` validate JWT signatures with the same `JWT_SECRET`.
- `dashboard-service` forwards the incoming `Authorization` header to downstream services.

Default seeded user:

- Username: `admin`
- Password: `admin123`

Additional seeded user:

- Username: `user`
- Password: `user123`

## Prerequisites

- Java 17+
- Maven 3.9+
- Docker (for PostgreSQL)

## Start PostgreSQL

```bash
cd backend
docker compose up -d
```

This creates databases: `luxegem_invoice`, `luxegem_market`, `luxegem_auth`.

## Run services

Start each in a separate terminal:

```bash
cd backend/auth-service && mvn spring-boot:run
cd backend/invoice-service && mvn spring-boot:run
cd backend/market-service && mvn spring-boot:run
cd backend/dashboard-service && mvn spring-boot:run
```

## Frontend integration

- Vite proxies:
  - `/api/*` -> `dashboard-service` (`8080`)
  - `/auth-api/*` -> `auth-service` (`8083`)

Frontend login call:

- `POST /auth-api/api/auth/login`

Dashboard call:

- `GET /api/dashboard/overview` with `Authorization: Bearer <token>`

## Shared JWT secret

Set the same secret for all services (optional override):

```bash
export JWT_SECRET='replace-with-a-long-random-secret-of-at-least-64-bytes'
```
