# Gym Management System

> **Demo Credentials** _(for testing only; replace in production)_  
> - **Admin**  
>   - Email: mustaqueem2000.admin@gmail.com  
>   - Password: 11111111  
> - **Client**  
>   - Email: mustaqueem.client@gmail.com  
>   - Password: 11111111  
> - **Trainer**  
>   - Email: mustaqueem.trainer@gmail.com  
>   - Password: 11111111  

---

## Overview

A **Gym Management System** backend built with **Node.js**, **Express**, and **MySQL**.  
Features include:

- User management (Admin, Client, Trainer)  
- Authentication & session handling  
- File uploads (e.g. profile pictures)  
- CRUD operations for clients, trainers, goals, etc.  
- Cross-origin support for separate frontend  

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/)  
- [XAMPP](https://www.apachefriends.org/index.html) (for local MySQL)  
- Git (optional)

---

## Setup Instructions

### 1. Clone & Database Import

1. **Clone** the repo:  
   ```bash
   git clone https://github.com/yourusername/gym-management.git
   cd gym-management
   ```

2. **Import** the SQL schema:  
   - Open **phpMyAdmin** (via XAMPP).  
   - Create a database named `gym`.  
   - Import the `.sql` file in `db_init/`.

### 2. Configure Environment

1. Create a file named `.env` in the project root:  
   ```ini
   # Server
   PORT=4444
   FRONTEND_PORT=54112
   SESSION_SECRET=your-strong-secret-key

   # MySQL
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=gym
   ```

2. Verify that `server.js` reads from `.env` (uses `dotenv`).

### 3. Install & Initialize

1. **Clean** any existing artifacts (if upgrading):  
   ```bash
   rm -rf node_modules package.json package-lock.json
   ```

2. **Initialize** npm & install dependencies:  
   ```bash
   npm init -y
   npm install express mysql2 bcrypt multer express-session cors dayjs dotenv
   ```

### 4. Update Database Connection

In `server.js`, ensure your pool matches the `.env` settings:

```js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});
```

### 5. Start the Server

```bash
node server.js
```

The API should now be running on `http://localhost:4444`.

---

## Project Structure

```
├── db_init/             # SQL schema and seed data
├── static/              # Public files (e.g., profile images)
├── .env                 # Environment variables
├── server.js            # Main Express server
└── package.json         # npm metadata & scripts
```

---

## Useful Scripts

- **Start server**:  
  ```bash
  npm start        # if defined in package.json
  # or
  node server.js
  ```

- **Restart on changes** (with nodemon):  
  ```bash
  npm install -g nodemon
  nodemon server.js
  ```

---

## Security Notice

- **Change** all default credentials before deploying.  
- Use **strong**, **unique** `SESSION_SECRET`.  
- Restrict CORS origins in production.  

---

## Further Improvements

- Add **role-based access control** (RBAC).  
- Integrate **JWT** for stateless auth.  
- Use an ORM (e.g., Sequelize) for migrations.  
- Add **unit tests** and **CI/CD** pipeline.  
