# Binhinav - Frontend

This is the frontend administration panel for the Binhinav Interactive Kiosk System. It is a modern single-page application built with React, Vite, and TypeScript, providing dedicated interfaces for both Admins and Merchants.

## Features

-   **Two Distinct User Panels**:
    -   **Admin Panel**: Full control over all system entities including places, merchants, categories, floor plans, kiosks, and advertisements.
    -   **Merchant Panel**: A simplified interface for merchants to manage their own store information and credentials.
-   **Role-Based Access Control**: Routes and UI elements are protected and tailored based on the logged-in user's role (admin or merchant).
-   **Modern UI/UX**: Built with [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/) for a clean, responsive, and accessible user interface.
-   **Efficient State Management**: Uses [Zustand](https://zustand-demo.pmnd.rs/) for simple and powerful global state management (e.g., authentication status).
-   **Form Handling**: Robust forms with client-side validation using [React Hook Form](https://react-hook-form.com/) and [Zod](https://zod.dev/).
-   **API Integration**: Seamlessly communicates with the backend API using [Axios](https://axios-http.com/), with interceptors for automatically attaching auth tokens.
-   **User Feedback**: Provides clear notifications for API actions (success, error) using [Sonner](https://sonner.emilkowal.ski/).

## Technology Stack

-   **Framework**: [React](https://react.dev/) (with TypeScript)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Routing**: [React Router DOM](https://reactrouter.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **HTTP Client**: [Axios](https://axios-http.com/)
-   **Form Management**: [React Hook Form](https://react-hook-form.com/)
-   **Schema & Validation**: [Zod](https://zod.dev/)
-   **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or newer recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A running instance of the [Binhinav Backend](<link-to-your-backend-repo>).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <repo-folder>/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the `frontend` directory.

```bash
cp .env.example .env
```

Now, edit the `.env` file to point to your running backend API.

```dotenv
# The full URL of your running backend server
VITE_API_URL=http://localhost:3000/api
```

### Running the Application

-   **Development Mode:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

-   **Building for Production:**
    ```bash
    npm run build
    ```
    This will create a `dist` directory with the optimized, static assets for deployment.
