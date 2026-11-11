# Sweety – Blood Glucose Tracker

A full-stack web application to record, manage, and monitor daily blood glucose readings.

## Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Add, view, edit, and delete glucose readings
- Four daily reading slots:
  - Morning
  - After Breakfast
  - After Lunch
  - After Dinner
- Validation for glucose values (40–600 mg/dL)
- Prevent duplicate readings for the same date and time slot
- Daily, Month-to-Date, and Previous Month reports
- Highest, lowest, and average glucose statistics
- User-specific reading management

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- PostgreSQL
- bcrypt
- JSON Web Token (JWT)

## Project Structure

```text
sweety-glucose-tracker/
├── client/
│   ├── src/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── seed.js
│   └── package.json
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd sweety-glucose-tracker
```

### 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` and configure your PostgreSQL database credentials and JWT secret.

Start the backend:

```bash
npm run dev
```

### 3. Frontend setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the application at:

http://localhost:5173/

## Database Seeding

To insert the demo user and sample glucose readings:

```bash
cd server
node seed.js
```

## Demo Login

- **Email:** demo@sweety.com
- **Password:** Sweety@123

## Notes

- The application uses PostgreSQL for data storage.
- Passwords are stored as bcrypt hashes.
- JWT is used for authentication.
- Each user can access their own glucose readings.

## Author

Developed as a Full Stack Developer assignment.