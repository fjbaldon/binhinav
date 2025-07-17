# Binhinav - Backend

This is the backend server for the Binhinav Interactive Kiosk System, built with NestJS. It provides a robust RESTful API for managing places, merchants, floor plans, advertisements, and more, with role-based authentication and data persistence using a PostgreSQL database.

## Features

- **Role-Based Authentication**: Secure login for Admins and Merchants using JWT (JSON Web Tokens).
- **CRUD Operations**: Comprehensive APIs for managing:
  - **Places**: Stores, restaurants, or points of interest.
  - **Merchants**: User accounts for store owners.
  - **Floor Plans**: Building layouts/maps.
  - **Categories**: For filtering and organizing places.
  - **Kiosks**: Physical kiosk terminal locations.
  - **Advertisements**: Images for display on kiosks.
- **File Uploads**: Handles image uploads for places (logos, covers), floor plans, and ads, storing them locally.
- **Data Validation**: Uses DTOs and `class-validator` to ensure incoming data is well-formed.
- **Database Seeding**: Automatically creates a default admin user and initial categories on first run.
- **Audit Logging**: Tracks and logs changes made by merchants to their store information.
- **Rate Limiting**: Basic protection against brute-force attacks.
- **Static File Serving**: Serves uploaded images via a public endpoint.

## Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database ORM**: [TypeORM](https://typeorm.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: [Passport.js](http://www.passportjs.org/) (`passport-jwt`, `passport-local`)
- **Validation**: `class-validator`, `class-transformer`
- **File Handling**: `multer`
- **Password Hashing**: `bcrypt`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A running [PostgreSQL](https://www.postgresql.org/download/) instance or [Docker](https://www.docker.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <repo-folder>/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the `backend` directory. You can copy the example file to get started:

```bash
cp .env.example .env
```

Now, fill in the `.env` file with your specific configuration.

```dotenv
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres      # Your PostgreSQL username
DB_PASSWORD=your_password # Your PostgreSQL password
DB_DATABASE=binhinav_db   # The name for your database

# JWT Authentication
JWT_SECRET=aVeryStrongAndSecretKeyThatYouShouldChange
JWT_EXPIRATION_TIME=3600s # e.g., 60s, 1h, 7d

# Initial Admin User (for database seeding)
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=password123
```

### Running the Application

-   **Development Mode (with hot-reloading):**
    ```bash
    npm run start:dev
    ```
    The server will start on `http://localhost:3000`. The first time you run it, it will attempt to connect to the database, synchronize the schema (`synchronize: true` is enabled), and seed the initial data.

-   **Production Mode:**
    ```bash
    npm run build
    npm run start:prod
    ```

## API Endpoints Overview

The API is served with a global prefix of `/api`.

-   `POST /api/auth/login`: Authenticate and receive a JWT.
-   `GET /api/auth/profile`: Get the current user's profile from their token.
-   `/api/places`: CRUD for places.
-   `/api/merchants`: CRUD for merchants.
-   `/api/admins`: Endpoints for admin self-management.
-   `/api/floor-plans`: CRUD for floor plans.
-   `/api/kiosks`: CRUD for kiosks.
-   `/api/ads`: CRUD for advertisements.
-   `/api/categories`: CRUD for categories.
-   `/api/audit-logs/merchant-changes`: View changes made by merchants.

Uploaded files are served from the `/uploads/` route. For example, a file stored at `uploads/places/logo.png` will be accessible at `http://localhost:3000/uploads/places/logo.png`.
