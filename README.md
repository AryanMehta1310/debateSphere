# DebateSphere – AI Assisted Online Debate Platform

## About the Project

DebateSphere is an AI-assisted online debate platform that provides a structured environment for users to participate in debates.

Users can register and login, create or join debate rooms, participate in discussions, submit arguments, vote for arguments and receive AI-based debate analysis.

## Objectives

* Provide an online platform for structured debates.
* Allow users to create and join debate rooms.
* Enable real-time communication between participants.
* Allow users to submit and vote on arguments.
* Use AI to provide debate summaries and feedback.
* Improve communication and critical thinking skills.

## Key Features

* User Registration and Login
* JWT Authentication
* Create and Join Debate Rooms
* Real-time Communication
* Argument Submission
* Audience Voting
* Debate Results
* AI-based Debate Analysis
* Responsive User Interface

## Technologies Used

### Frontend

* React.js
* Vite
* React Router
* Axios
* CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt

### Other Technologies

* Socket.io
* Google Gemini API

## Project Structure

```text
DebateSphere/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## How the Project Works

```text
User
  ↓
Register / Login
  ↓
Debate Dashboard
  ↓
Create / Join Debate
  ↓
Debate Room
  ↓
Arguments & Discussion
  ↓
Voting
  ↓
Debate Results
  ↓
AI Analysis
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AryanMehta1310/debateSphere.git
cd debateSphere
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

## Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

**Do not upload `.env` to GitHub.**

## Running the Project

### Backend

```bash
cd backend
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Open the local URL provided by Vite in the terminal.

## Testing

The main features can be tested by:

1. Registering a new user
2. Logging in
3. Creating a debate
4. Joining a debate
5. Participating in the debate
6. Submitting arguments
7. Voting
8. Viewing results
9. Generating AI analysis

## Team Members

* Aryan Mehta
* Ayush Kumar Rao
* Ayush
* Ayush Raj

## Course Information

**Course:** Back-end Engineering
**Course Code:** 25CS022

## Project Status

The project is being developed as an academic MERN Stack project with real-time communication and Generative AI integration.
