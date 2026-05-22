# 📍 binhinav — locate indoors

<div align="center">
  <img src="docs/assets/binhinav-logo.svg" alt="binhinav logo" width="120" />
  <p><strong>A Cohesive Digital Ecosystem for Indoor Navigation and Tenant Management</strong></p>
  <p>Engineered by <strong>binhitech</strong> — <em>Growth, Engineered.</em></p>

  <p align="center">
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Badge" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge" />
    <img src="https://img.shields.io/badge/TailwindCSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind Badge" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres Badge" />
  </p>
</div>

---

## 🌟 Overview

**binhinav** is a complete, fully integrated indoor mapping and navigation ecosystem designed to bridge venue administrators, retail/office tenants (merchants), and physical visitors. Rather than just offering static floor guides, **binhinav** acts as a dynamic digital directory that empowers administrators to oversee venue layouts, lets tenants control their brand profiles in real-time, and guides visitors through highly responsive, interactive kiosks.

The project is developed by **binhitech**, a software firm focused on cultivating modern growth and engineering scalable, intuitive digital experiences.

---

## 📁 Repository Structure

The workspace is organized as a multi-package repository containing independent, modular components that communicate seamlessly:

```yaml
binhinav/
├── backend/            # NestJS API gateway, Database models, and Admin/Merchant controllers
├── kiosk/              # React + TS + Tailwind v4 interactive touch-screen app for visitors
├── portal/             # React + TS + Tailwind v4 administration dashboard (Admin & Merchant roles)
├── docs/               # Static documentation portal containing company, user & system manuals
└── README.md           # This primary repository overview
```

---

## 🚀 Key Modules & Features

### 🖥️ 1. The Interactive Kiosk (`/kiosk`)
The public-facing application designed for physical touch-screen devices placed strategically around a venue.
*   **Intuitive Search:** Fast, auto-suggesting search interface to find locations, offices, shops, or categories.
*   **Smart Map Navigation:** Smooth 2D map viewer with interactive touch gestures (zoom, pan, pinch) that centers, crops, and highlights routes dynamically.
*   **Multi-floor Logic:** Seamless animations and floor switches if a selected destination is on another floor.
*   **Engaging Advertisement Rotation:** Automatic full-screen promotion slideshow triggers after 60 seconds of idle time to drive traffic to tenants.
*   **One-Time Provisioning:** Secure setup wizard requiring a 6-character pairing key issued by the Admin Portal.

### 💼 2. The Admin & Merchant Portal (`/portal`)
A multi-role workspace created using Tailwind CSS v4, shadcn/ui, and Zustand for state management.
*   **For Administrators:**
    *   **Venue Control:** Upload vector/raster floor maps, define distinct categories (with custom icons), and assign interactive coordinate pins to locations.
    *   **Kiosk & Ads Manager:** Provision pairing keys for kiosk hardware and drag-and-drop promotional banners/videos.
    *   **Insights Dashboard:** Search analytics charts (using Recharts) to trace search trends, and audit logs tracking merchant updates.
*   **For Merchants (Tenants):**
    *   **Storefront Autonomy:** Direct access to update descriptions, contact details, business hours, and upload circular logos and wide cover photos.
    *   **Real-time Synchronization:** Changes immediately sync down to the backend database and update on physical kiosks instantly.

### 🛡️ 3. The Enterprise Backend (`/backend`)
A production-ready NestJS REST API, fortified with security guards and structured patterns.
*   **Database ORM:** Managed using TypeORM connecting to PostgreSQL.
*   **Rate Limiting & Security:** Throttler guards protecting endpoints, bcrypt password hashing, and Passport-JWT authorization.
*   **State Logs & Events:** Built-in `EventEmitter` driving search tracking and merchant audit tracking.
*   **Static Asset CDN:** Built-in static server serving uploads (floor plans, logos, cover photos) efficiently.

---

## 📊 System Workflows

The Binhinav ecosystem integrates three primary pipelines:

### Kiosk Visitor Flow
```mermaid
graph TD
    subgraph "1. Initialization"
        A[Visitor Approaches Kiosk] --> B{Is Kiosk Provisioned?};
        B -- No --> B1[Display Provisioning Screen];
        B1 -- Admin enters pairing key --> B2[Provisioning & App Load];
        B2 --> C[Show Main Map Interface];
        B -- Yes --> C;
    end

    subgraph "2. Main Interaction Loop"
        C -- "1 min Inactivity" --> D[Display Ad Overlay];
        D -- "Visitor Taps Screen" --> C;
        C -- "Visitor Interacts" --> E{Selects Action};
    end

    subgraph "3. Finding a Destination"
        E -- "Taps Search Bar" --> F[Input Search Term];
        F --> G[Display Search Results];
        G -- "Selects a Place" --> J;

        E -- "Taps Category" --> H[Select Category];
        H --> I[Highlight Places on Map];
        I -- "Selects a Place" --> J;
        
        E -- "Taps a Pin on Map" --> J[Show Place Details Sheet];
    end
    
    subgraph "4. Navigation"
        J --> K[Clicks 'Show on Map'];
        K --> L{Destination on different floor?};
        L -- Yes --> M[Show Floor Transition];
        M --> N[Switch Floor & Perform Navigation];
        L -- No --> N;
        N --> O((Destination Focused on Map));
        O -- "New Interaction" --> C;
    end
```

### Portal Administration Flow
```mermaid
graph TD
    subgraph "1. Access"
        A[Admin Navigates to Portal] --> B[Login Page];
        B -- Enters Credentials --> C{Authenticate};
        C -- Success --> D((Dashboard));
    end

    subgraph "2. Setup & Management"
        D --> E{Select Management Area};
        E -- Floor Plans --> F[Upload & Order Floor Plans];
        F --> E;
        E -- Categories --> G[Create & Edit Categories];
        G --> E;
        E -- Places --> H[Add/Edit Places & Assign Merchants];
        H --> E;
        E -- Kiosks & Ads --> I[Manage Kiosks & Ad Rotations];
        I --> E;
        E -- Users --> J[Manage Admins & Merchants];
        J --> E;
    end

    subgraph "3. Monitoring"
        D --> K[View Search Analytics];
        D --> L[Review Merchant Audit Logs];
    end
```

---

## 🛠️ Local Installation & Development

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [npm](https://www.npmjs.com/)
*   [PostgreSQL](https://www.postgresql.org/) database

### 1. Database Setup
Create a new PostgreSQL database instance for the application:
```sql
CREATE DATABASE binhinav_db;
```

### 2. Backend Server Configuration
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` root directory and set your credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_postgres_username
   DB_PASSWORD=your_postgres_password
   DB_DATABASE=binhinav_db
   ```
4. Start the server in hot-reload development mode (auto-schema sync will run on first connection):
   ```bash
   npm run start:dev
   ```
   The backend API will run on `http://localhost:3000/api`.

### 3. Portal Setup (Admin & Merchant)
1. Navigate to the `portal` directory:
   ```bash
   cd ../portal
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `portal/` root directory and point to the API:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Spin up the Vite development server:
   ```bash
   npm run dev
   ```
   Open the logged terminal port (typically `http://localhost:5173`) in your browser.

### 4. Kiosk Setup
1. Navigate to the `kiosk` directory:
   ```bash
   cd ../kiosk
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `kiosk/` root directory:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Spin up the Kiosk development server:
   ```bash
   npm run dev
   ```
   Open the logged terminal port (typically `http://localhost:5174`) in your browser to view the kiosk canvas.

### 5. Documentation Server
To view the company background, team profiles, rationale, and manuals, simply run a static server in the `/docs` directory or open the `/docs/index.html` file directly in any modern web browser.

---

## 🎨 Tech Stack Matrix

| Component | Technology / Library | Usage |
| :--- | :--- | :--- |
| **Backend** | NestJS, TypeScript | REST API Gateway, Core Logic |
| | TypeORM, `pg` | Relational Database Mapping & Access |
| | Passport, JWT, Bcrypt | Token Authentication & Security |
| | NestJS Serve-Static | Uploaded Assets Server |
| **Portal** | React, TS, Vite | Control Panel SPA Framework |
| | Tailwind CSS v4, Radix UI | Visual Component styling |
| | TanStack Query (React Query) | Server State Management & Cache |
| | Zustand | Client UI Global State Management |
| | Recharts, React Table | Dashboard Analytics & Logs Grid |
| | dnd-kit | Draggable Kiosk Ads Ordering |
| **Kiosk** | React, TS, Vite | Public Map Interactive UI |
| | Tailwind CSS v4, Lucide Icons | Responsive styling and icon system |
| | react-zoom-pan-pinch | 2D Floor Plan Navigation gestures |
| | Embla Carousel | Advertisement carousel slider |
| | framer-motion | Smooth transitions and layout shifts |

---

## 🌱 Meet the Growth Engineers

The talented developers and designers who engineered **binhinav**:

*   **Francis John Baldon** — *Lead Developer* 💻
*   **Kieth Disney Oyao** — *Product Researcher* 🔍
*   **Jhea Mae Alom** — *UI/UX Designer* 🎨
*   **Regin Mae Cruda** — *Project Manager* 📋
*   **Richie Mae Villorejo** — *Product Tester* 🧪

---
<div align="center">
  <sub>© 2025 binhitech. All rights reserved.</sub>
</div>
