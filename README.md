# TaskFlow - Team Task Tracker

TaskFlow is a collaborative task management platform featuring a **Spring Boot 3 + Kotlin** REST API backend and a responsive **React 18 + TypeScript** Kanban frontend.

---

## Architecture Overview

```
task-flow/
├── backend/                  # Spring Boot 3 + Kotlin REST API
│   ├── src/main/kotlin/      # Application source code
│   │   └── com/taskflow/
│   │       ├── domain/       # JPA Entities, Repositories & Specifications
│   │       ├── dto/          # Request & Response Contracts
│   │       ├── service/      # Business Logic & Ownership Rules
│   │       ├── controller/   # REST Controllers & OpenAPI annotations
│   │       ├── security/     # JWT Authentication & Spring Security
│   │       ├── mapper/       # DTO / Entity Mappers
│   │       └── exception/    # Global Exception Handler & Custom Errors
│   ├── src/main/resources/
│   │   ├── application.yml   # Profiles for dev (H2) and prod (PostgreSQL)
│   │   └── db/migration/     # Flyway SQL migrations (V1__init_schema.sql)
│   ├── src/test/kotlin/      # MockK Unit Tests & SpringBootTest
│   ├── pom.xml               # Maven build configuration
│   └── Dockerfile            # Multi-stage production container
│
├── frontend/                 # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── api/              # Centralized Axios client & API layer
│   │   ├── components/       # Reusable components (TaskCard, SummaryBar, Modals)
│   │   ├── context/          # AuthContext for session management
│   │   ├── pages/            # BoardPage (Kanban) and AuthPage (Login/Register)
│   │   ├── test/             # React Testing Library + Vitest component tests
│   │   └── types/            # TypeScript interfaces & types
│   ├── package.json          # Dependencies & scripts
│   ├── vite.config.ts        # Vite configuration & dev proxy
│   └── Dockerfile            # Multi-stage Nginx container
│
└── docker-compose.yml        # Orchestrates PostgreSQL, Backend, and Frontend
```

---

## Design Patterns Used

As required by engineering expectations, the project incorporates clean, idiomatic design patterns:

### 1. Strategy / Specification Pattern (`TaskSpecification.kt`)
- **Use Case**: Task filtering and query building.
- **Implementation**: Instead of brittle nested conditionals or manual string concatenation, `TaskSpecification` implements atomic filtering strategies (`hasProject`, `hasStatus`, `hasPriority`, `hasAssignee`) that are composed dynamically via Spring Data JPA's `Specification.where().and()`.
- **Benefit**: Decouples filtering logic from query execution and allows extensible filter additions without modifying existing repository methods.

### 2. Assembler / Extension Mapper Pattern (`EntityMappers.kt`)
- **Use Case**: DTO transformation and entity encapsulation.
- **Implementation**: Pure Kotlin extension functions (`Task.toResponse()`, `Project.toResponse()`, `User.toResponse()`) isolate JPA entities from the public API layer.
- **Benefit**: Guarantees zero sensitive data leakage (`passwordHash`) and prevents Hibernate proxy/lazy-loading serialization pitfalls.

### 3. Repository Pattern (`domain/repository/*`)
- **Use Case**: Abstracting data access mechanisms behind strongly-typed interfaces.
- **Implementation**: Spring Data JPA repositories (`UserRepository`, `ProjectRepository`, `TaskRepository`).
- **Benefit**: Enables fast, isolated unit testing of the service layer with MockK without spinning up database connections.

---

## Seed Data & Demo Credentials

When running with the `dev` profile (default) or after database migration, sample data is automatically seeded:

| Field | Value |
| :--- | :--- |
| **Email** | `demo@taskflow.dev` |
| **Password** | `Password123!` |
| **Teammate Account** | `alex@taskflow.dev` (`Password123!`) |
| **Pre-loaded Board** | "TaskFlow Core Platform" with tasks across To Do, In Progress, Done, and an Overdue task |

*(A **"Quick Demo Login"** button is also available directly on the login screen for one-click access).*

---

## Getting Started

### Option 1: Run with Docker Compose (Recommended)
Start the entire stack (PostgreSQL, Spring Boot backend, and Nginx frontend) with one command:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost](http://localhost)
- **Backend REST API**: [http://localhost:8080](http://localhost:8080)
- **OpenAPI / Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

### Option 2: Local Development Setup

#### 1. Backend (Zero-Config with H2 In-Memory)
The backend defaults to the `dev` profile using an in-memory H2 database (in PostgreSQL mode) with Flyway migrations applied automatically:

```bash
cd backend
# Windows
mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

- API Base: `http://localhost:8088/api`
- Swagger UI: `http://localhost:8088/swagger-ui.html`
- H2 Console: `http://localhost:8088/h2-console` (JDBC URL: `jdbc:h2:mem:taskflowdb`)

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

- Access the frontend at: `http://localhost:5173`
- The Vite dev server automatically proxies `/api` requests to `http://localhost:8088`.

---

## Running Automated Tests

### Backend Tests (MockK Unit Tests + Spring Boot Context Test)
```bash
cd backend
# Windows
mvnw.cmd test

# Linux / macOS
./mvnw test
```
*Executes 16 tests covering `AuthService`, `ProjectService`, `TaskService` (ownership, overdue logic, validation), and application context loading.*

### Frontend Tests (Vitest + React Testing Library)
```bash
cd frontend
npm test
```
*Executes component tests for `SummaryBar` (metric rendering, overdue highlight) and `TaskCard` (status dropdown change, overdue badge).*

---

## API Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register user account |
| `POST` | `/api/auth/login` | Login and obtain JWT token |
| `GET` | `/api/projects` | List authenticated user's projects |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/{id}/summary` | Aggregate counts per status + overdue count |
| `GET` | `/api/projects/{id}/tasks` | Filter, sort, and paginate tasks |
| `POST` | `/api/projects/{id}/tasks` | Create task under a project |
| `PUT` | `/api/tasks/{id}` | Update task details |
| `PATCH` | `/api/tasks/{id}/status` | Fast status transition (`TODO`, `IN_PROGRESS`, `DONE`) |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

---

## Assumptions & Trade-offs

1. **Multi-Tenant Data Ownership**: Users can only read and mutate projects and tasks they own. Attempting to query or modify an unowned resource yields `403 Forbidden` (or `404 Not Found` if querying by ID directly to avoid resource enumeration).
2. **Overdue Calculation**: A task is flagged as overdue when its `dueDate < CURRENT_DATE` and its status is **not** `DONE`.
3. **In-Memory H2 for Dev vs PostgreSQL for Prod**: H2 in PostgreSQL compatibility mode was selected for zero-friction local cloning and quick evaluation without requiring a running PostgreSQL instance, while Docker Compose provisions standard PostgreSQL 16.
4. **State Management**: React Context (`AuthContext`) paired with localized component state was chosen over Redux to minimize boilerplate while providing clean separation of concerns.

