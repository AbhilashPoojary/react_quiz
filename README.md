# 🎯 React Quiz

A full-stack quiz platform built with **React, Node.js, Express, and MongoDB**, featuring configurable quizzes, challenges, events, leaderboards, analytics, user profiles, notifications, and administrative controls.

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript)

---

## 📖 Project Overview

React Quiz is a full-stack quiz application designed to provide an interactive and configurable quiz experience.

Users can create accounts, configure and take quizzes, track their results, analyze performance, participate in challenges and events, view leaderboards, manage their profiles, and receive application notifications.

The platform also includes administrative functionality for managing application settings and quiz-related features.

---

## ✨ Features

### 👤 User & Authentication

* User registration and login
* JWT-based authentication
* Protected routes
* Session handling
* Forgot password
* Reset password
* Change password
* Password expiry notifications
* User profile management
* Profile image management
* Unauthorized-access handling

### 🧠 Quiz

* Configurable quiz setup
* Category selection
* Difficulty selection
* Multiple quiz options
* Timed quizzes
* Per-question timing support
* Quiz result tracking
* Score calculation
* Detailed quiz analysis
* Quiz history

### 🏆 Leaderboards

* User ranking
* Score comparison
* Quiz performance tracking
* Leaderboard views

### ⚔️ Challenges

Challenge other users and compare quiz performance.

* Create challenges
* Challenge landing page
* Challenge quiz sessions
* Challenge attempts
* Challenge results

### 📅 Quiz Events

Create and participate in quiz-based events.

* Event creation
* Event registration
* Event quizzes
* Event results
* My Events dashboard

### 📊 Analytics

Visualize quiz performance using multiple analytical views.

Supported visualization components include:

* Category bar charts
* Bubble charts
* Heatmaps
* Polar area charts
* Progress views
* Radar charts
* Detailed quiz analysis

### 🔔 Notifications

* Application notifications
* User-specific notifications
* Admin notifications
* Notification management

### 🛠️ Administration

Administrative functionality includes:

* Admin routes
* Admin layout
* Application settings
* Quiz configuration
* Notification management
* Event management
* Feature configuration

---

## 🖼️ Screenshots

Add screenshots of the application here as the UI evolves.

### Dashboard

<img width="962" height="877" alt="image" src="https://github.com/user-attachments/assets/45286f8d-bdc5-4d3c-a3ea-be657ec27dc4" />


### Quiz Setup

<img width="932" height="717" alt="image" src="https://github.com/user-attachments/assets/fcfe6079-129a-4ab2-8b56-1f2f323f1c89" />


### Quiz Analysis

<img width="947" height="467" alt="image" src="https://github.com/user-attachments/assets/8b68961c-5e13-4653-a5a1-86d4dbdb94b4" />


### Leaderboard

<img width="930" height="937" alt="image" src="https://github.com/user-attachments/assets/befaa09e-f9cb-4fb2-b180-4e460a178395" />


Recommended project structure for screenshots:

```text
docs/
└── screenshots/
    ├── dashboard.png
    ├── quiz-setup.png
    ├── quiz-analysis.png
    └── leaderboard.png
```

After adding screenshots, replace the placeholders above with Markdown such as:

```text
![Dashboard](docs/screenshots/dashboard.png)
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Redux
* React Router
* JavaScript
* CSS
* Vite

### Backend

* Node.js
* Express.js
* JWT authentication
* REST APIs

### Database

* MongoDB
* Mongoose

---

## 📁 Project Structure

```text
react_quiz/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   └── admin/
│   │   ├── slice/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── styles.css
│   │
│   ├── package.json
│   └── .gitignore
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── Modals/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   ├── .env.example
│   ├── package.json
│   └── .gitignore
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git

Check your installations:

```bash
node --version
npm --version
git --version
```

---

## 📥 Clone the Repository

```bash
git clone https://github.com/AbhilashPoojary/react_quiz.git
cd react_quiz
```

---

## 💻 Frontend Setup

Navigate to the client:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The terminal will display the local URL where the frontend is running.

---

## ⚙️ Backend Setup

Open another terminal and navigate to:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Configure the environment variables and start the server:

```bash
npm start
```

If the project uses another development command such as:

```bash
npm run dev
```

use the script configured in `server/package.json`.

---

## 🔐 Environment Variables

Sensitive configuration should be stored in:

```text
server/.env
```

The real `.env` file must **never be committed to Git**.

Use:

```text
server/.env.example
```

as the template for required configuration.

Create your local environment file on Windows:

```bash
cd server
copy .env.example .env
```

Example:

```env
PORT=<your-port>
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
```

Add any additional variables required by the application to `.env.example`, but **never put real passwords, secrets, tokens, or production credentials in that file**.

---

## 🔒 Git Ignore Configuration

The project excludes sensitive and generated files such as:

```gitignore
node_modules/

.env
.env.*
!.env.example

dist/
build/
```

This ensures dependencies, environment secrets, and generated builds are not committed.

---

## 🔑 Authentication Flow

The application uses JWT-based authentication.

A simplified authentication flow is:

```text
User
  │
  ▼
Login / Signup
  │
  ▼
Backend Authentication
  │
  ▼
JWT Generated
  │
  ▼
Authenticated Session
  │
  ├──► Protected User Routes
  │
  └──► Protected Admin Routes
```

Protected backend APIs validate the authentication token before processing secured requests.

---

## 🧩 Application Modules

```text
React Quiz
│
├── Authentication
│   ├── Sign In
│   ├── Sign Up
│   ├── Forgot Password
│   ├── Reset Password
│   └── Change Password
│
├── Quiz
│   ├── Quiz Setup
│   ├── Quiz Play
│   ├── Results
│   └── Analysis
│
├── Challenges
│   ├── Create Challenge
│   ├── Play Challenge
│   └── Challenge Results
│
├── Events
│   ├── Event Registration
│   ├── Event Quiz
│   └── Event Results
│
├── Leaderboards
│
├── Notifications
│
├── User Profile
│
└── Administration
    ├── Settings
    ├── Events
    ├── Notifications
    └── Feature Configuration
```

---

## 🌿 Git Workflow

Create a feature branch:

```bash
git checkout -b feature/feature-name
```

Stage your changes:

```bash
git add .
```

Check what will be committed:

```bash
git status
```

Commit:

```bash
git commit -m "Add feature description"
```

Push the branch:

```bash
git push -u origin feature/feature-name
```

For direct updates to `main`:

```bash
git add .
git commit -m "Update quiz application"
git push origin main
```

---

## 🗺️ Roadmap

Potential future improvements include:

* Enhanced quiz analytics
* Additional quiz modes
* Improved challenge functionality
* Advanced event management
* Enhanced admin controls
* Real-time notifications
* More leaderboard filters
* Improved mobile responsiveness
* Additional profile customization
* Expanded quiz configuration
* Performance optimizations
* Automated testing
* CI/CD integration

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push your branch
6. Create a pull request

---

## 📝 License

This project is currently intended for learning and personal development.

A formal open-source license can be added later if the project is made available for public contribution.

---

## 👨‍💻 Author

**Abhilash Poojary**

GitHub: `AbhilashPoojary`

---

⭐ If you find the project useful, consider starring the repository.
