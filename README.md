# Gym Management System

## Overview
This project is a Gym Management System backend built with Node.js, Express, and MySQL. It manages clients, trainers, fitness goals, and related functionalities.

---

## Setup Instructions

### Step 1: Install XAMPP and Import Database

- Install [XAMPP](https://www.apachefriends.org/index.html) to run MySQL locally.
- Import the SQL database file located in the `db_init` folder into your MySQL database.
- Update the database connection details in `server.js` to match your local setup:
- 
```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gym',
});


###Step 2: Prepare Project Environment

- Delete the following from your project folder if they exist:
- package-lock.json
- package.json
- node_modules/ folder

###Step 3: Initialize and Install Dependencies

- Open your terminal inside the project directory and run the following commands in order:

- npm init -y
- npm install express
- npm install multer
- npm install express mysql2 bcrypt body-parser
- npm install dayjs
- npm install dayjs-plugin-utc dayjs-plugin-timezone

###Step 4: Run the Server from the terminal of VS Code

- node server.js
