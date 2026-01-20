# Project Setup Guide

## ⚙️ Prerequisites
- Node.js `v18+` or `v20+` (Recommended for Next.js 16)
- PostgreSQL database instance (Local or Remote)

## 📥 Installation

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd tuli-v1
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root based on `.env.example` (if available) or required keys:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/tuli?schema=public"
   # Add other secrets here
   ```

3. **Database Setup**
   Initialize the Prisma client and push the schema:
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev
   ```

## 🚀 Running the Project

- **Development Server**:
  ```bash
  npm run dev
  # Server runs at http://localhost:3000
  ```

- **Database GUI (Prisma Studio)**:
  ```bash
  npx prisma studio
  # Opens at http://localhost:5555
  ```

- **Production Build**:
  ```bash
  npm run build
  npm start
  ```
