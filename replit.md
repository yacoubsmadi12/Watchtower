# ZainJo Watchtower

## Overview

ZainJo Watchtower is an operation log monitoring and analysis platform designed to receive and analyze logs from Huawei NMS systems. The platform functions as a lightweight security information and event management (SIEM) system, providing real-time log ingestion, intelligent parsing, rule-based analysis, and security alerting capabilities.

The system is built as a full-stack web application with a React-based frontend for visualization and monitoring, and a dual-backend architecture supporting both development (Node.js/Express) and production (Python/Flask) deployments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Built on shadcn/ui components with Radix UI primitives, providing a comprehensive set of accessible, customizable UI elements. The design system uses Tailwind CSS for styling with a custom theme configuration supporting dark mode.

**State Management**: TanStack Query (React Query) handles server state management and data fetching, providing caching, background updates, and optimistic updates. Local state uses React hooks and context for authentication and real-time monitoring features.

**Routing**: Uses Wouter for client-side routing, providing a lightweight alternative to React Router.

**Key Features**:
- Real-time log monitoring dashboard with live feed updates
- Security alerts panel for incident tracking
- Role-based access control (RBAC) visualization
- Weekly analysis reports with charting
- System settings and log source management
- Mock data simulation for development and testing

**Design Patterns**: The frontend implements a component-based architecture with clear separation between presentation components (`components/ui`), feature components (`components/dashboard`), and page-level components (`pages`). Protected routes ensure authentication is required for accessing the monitoring interface.

### Backend Architecture

**Dual Backend Strategy**: The application supports two backend implementations to accommodate different deployment scenarios:

1. **Development Backend (Node.js/Express)**: 
   - Runs on Replit for prototyping and development
   - Uses in-memory storage for rapid iteration
   - Provides REST API endpoints for log sources and entries
   - Serves the production-built frontend via static file serving
   - Hot module replacement (HMR) support via Vite middleware in development

2. **Production Backend (Python/Flask)**:
   - Designed to run on Ubuntu VM for real-world deployment
   - Receives logs via Syslog UDP on port 1514
   - Supports HTTP POST API for log ingestion (`/api/logs`)
   - Implements MySQL database integration for persistent storage
   - Includes log parsing engine supporting multiple formats (CEF, Key-Value, Huawei CSV, Syslog)

**API Design**: RESTful endpoints following standard HTTP methods:
- `GET /api/sources` - Retrieve all log sources
- `POST /api/sources` - Create new log source
- `PUT /api/sources/:id` - Update log source
- `DELETE /api/sources/:id` - Delete log source
- `GET /api/logs` - Retrieve log entries (with optional sourceId filter)
- `POST /api/logs` - Create new log entry
- `GET /api/reports` - Generate and download reports

**Log Parsing Engine**: Implements intelligent multi-format parsing with fallback strategies:
1. Huawei CSV format detection (comma-separated with date patterns)
2. CEF (Common Event Format) parsing
3. Key-Value pair extraction
4. Generic syslog text parsing as fallback

**Rules Engine**: Evaluates incoming logs against configurable security rules:
- Role-based permission checking (forbidden operations)
- Sensitive operation detection (ROOT_LOGIN, DB_DROP, etc.)
- Keyword-based anomaly detection
- Generates alerts with severity levels (low, medium, high, critical)

### Data Storage Solutions

**Development Storage**: In-memory data structures (`MemStorage` class) using Maps for users, log sources, and log entries. Includes seed data for immediate functionality during development.

**Production Storage**: MySQL database configured via environment variables:
- Connection details: host, user, password, database name
- Schema supports events table with timestamp, source, raw data, and parsed JSON
- Drizzle ORM integration with PostgreSQL dialect (configured but not actively used in current implementation)

**Database Schema** (Drizzle ORM definitions):
- `users`: Authentication and user management
- `logSources`: Registered systems being monitored (name, IP address, status, description)
- `logEntries`: Individual log records with source reference, severity, message, analysis status, and raw data

### Authentication and Authorization

**Authentication**: Mock authentication system for development using React Context API. Stores user session in localStorage with username and role information. Login accepts any non-empty credentials for demonstration, with special handling for admin/admin combination.

**Protected Routes**: Higher-order component wrapper checks authentication status before rendering protected pages, redirecting unauthenticated users to login page.

**Role-Based Access Control (RBAC)**: Data model supports roles with associated permissions:
- Roles define user types (Admin, Operator, Auditor, etc.)
- Permissions specify allowed/forbidden operations per role
- Rules engine evaluates user actions against role permissions
- Violations generate security alerts with configurable severity

## External Dependencies

### Frontend Libraries

**Core Framework**:
- React 18+ for UI rendering
- TypeScript for type safety
- Vite for build tooling and development server

**UI Components**:
- Radix UI primitives (@radix-ui/*) for accessible component foundations
- shadcn/ui component library
- Tailwind CSS for styling
- class-variance-authority and clsx for dynamic class composition
- Lucide React for icon system

**Data Management**:
- TanStack Query for server state and data fetching
- React Hook Form with Zod resolvers for form validation
- date-fns for date manipulation

**Visualization**:
- Recharts for data visualization and charting
- embla-carousel-react for carousel functionality

**Routing & Navigation**:
- Wouter for client-side routing

### Backend Dependencies

**Node.js Backend**:
- Express for HTTP server and routing
- Drizzle ORM for database operations
- connect-pg-simple for session storage
- @neondatabase/serverless for PostgreSQL connectivity
- zod for schema validation

**Python Backend**:
- Flask for web framework
- flask-cors for CORS support
- mysql-connector-python for MySQL database connectivity
- python-dateutil for date handling

### Build & Development Tools

- esbuild for fast JavaScript bundling
- PostCSS and Autoprefixer for CSS processing
- TypeScript compiler for type checking
- Drizzle Kit for database migrations

### Replit-Specific Integrations

- @replit/vite-plugin-runtime-error-modal for error overlays
- @replit/vite-plugin-cartographer for code navigation
- @replit/vite-plugin-dev-banner for development indicators
- Custom meta-images plugin for OpenGraph image handling

### Monitored Systems Integration

The platform is designed to integrate with Huawei network management systems:
- **NCE FAN HQ** (10.119.19.95)
- **NCE IP +T** (10.119.19.80)
- **NCE HOME_INSIGHT** (10.119.21.6)
- **U2020** (10.119.10.4)
- **PRS** (10.119.10.104)

These systems forward logs via Syslog UDP protocol or HTTP POST to the monitoring platform for analysis and alerting.