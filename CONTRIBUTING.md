# 🤝 Contributing to Journii

Thank you for your interest in contributing to **Journii**.

Journii is an **AI-powered travel ecosystem** combining:

* 🌍 Cultural discovery
* 🧠 AI trip planning
* 🗺 Map-based itinerary building
* 📸 Travel social media
* 🤝 Collaborative trip planning
* 🏨 Global travel marketplace
* 🚆 Smart transit navigation
* 🏆 Gamified travel experiences

The platform is built with a **FastAPI backend and a React Native (Expo) frontend**, and integrates AI services to power travel recommendations and trip planning.

We welcome contributions that improve:

* Features
* Performance
* Documentation
* Testing
* UI/UX
* Security
* DevOps tooling

---

# 🚀 Getting Started

## Prerequisites

### Backend

* Python **3.10+**
* pip
* virtualenv
* PostgreSQL *(recommended)* or SQLite *(for development)*

### Frontend

* Node.js **18+**
* npm **8+**
* Expo CLI
* Expo Go (for mobile testing)

### General

* Git
* GitHub account
* Basic knowledge of **FastAPI, React Native, and TypeScript**

---

# 📂 Project Structure

```
Journii/
│
├── backend/
│   ├── app/
│   │   ├── api/              # API route definitions
│   │   ├── core/             # Security, config, middleware
│   │   ├── db/               # Database sessions & Redis
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routers/          # Feature-based API routers
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Business logic & AI services
│   │   ├── utils/            # Utility functions
│   │   ├── websocket/        # Real-time messaging
│   │   ├── tests/            # Backend tests
│   │   └── main.py           # FastAPI application entry
│
├── frontend/
│   ├── app/
│   │   ├── (tabs)/           # Main navigation tabs
│   │   ├── itinerary/        # Trip builder
│   │   ├── marketplace/      # Travel services marketplace
│   │   ├── chat/             # Messaging
│   │   ├── experience/       # Experience pages
│   │   ├── screens/          # UI screens
│   │   └── navigation/       # App navigation
│   │
│   ├── components/           # UI components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API client + websocket
│   ├── stores/               # Zustand state stores
│   └── assets/images/
│
├── .github/
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

---

# 🛠 Setting Up the Development Environment

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/ImGJUser1/Journii.git
cd Journii
```

---

# Backend Setup

Navigate to the backend directory.

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate it.

### Windows

```bash
.\venv\Scripts\activate
```

### macOS/Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r app/requirements.txt
```

Create a `.env` file inside:

```
backend/app/.env
```

Example configuration:

```env
DATABASE_URL=sqlite:///journii.db
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
REDIS_URL=redis://localhost:6379
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```
http://localhost:8000
```

Interactive API docs:

```
http://localhost:8000/docs
```

---

# Frontend Setup

Navigate to frontend.

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Expo development server:

```bash
npm start
```

Run using:

* 📱 Expo Go (scan QR code)
* 🤖 Android emulator
* 🍎 iOS simulator

Make sure the API URL points to your backend:

```
http://localhost:8000
```

---

# 🌱 Contribution Workflow

## 1️⃣ Fork the Repository

Fork Journii on GitHub.

Then clone your fork:

```bash
git clone https://github.com/<your-username>/Journii.git
```

---

## 2️⃣ Create a Branch

Create a branch for your feature or fix.

```bash
git checkout -b feature/feature-name
```

Examples:

```
feature/ai-trip-optimization
feature/transit-planner
fix/login-auth-bug
docs/update-readme
```

---

## 3️⃣ Make Your Changes

Possible contribution areas:

### Backend

* API endpoints
* AI recommendation logic
* database models
* authentication improvements
* performance optimizations
* WebSocket messaging
* security enhancements

Backend directories:

```
backend/app/routers
backend/app/services
backend/app/models
backend/app/schemas
```

---

### Frontend

* UI components
* trip builder interface
* travel feed
* marketplace pages
* chat interface
* animations
* mobile UX improvements

Frontend directories:

```
frontend/app
frontend/components
frontend/hooks
frontend/services
frontend/stores
```

---

# 🧪 Testing

## Backend Tests

Tests are written using **pytest**.

Run backend tests:

```bash
cd backend
pytest
```

Add tests inside:

```
backend/app/tests/
```

---

## Frontend Tests

Frontend tests use **Jest**.

Run tests:

```bash
cd frontend
npm test
```

Add tests inside:

```
frontend/__tests__/
```

---

# 🧑‍💻 Coding Standards

## Backend (Python)

* Follow **PEP8**
* Use **type hints**
* Use **Pydantic schemas** for validation
* Keep business logic inside **services**
* Keep routers thin

Example structure:

```
router → service → database
```

---

## Frontend (React Native)

* Use **TypeScript**
* Use **NativeWind** for styling
* Use **React Query** for API calls
* Use **Zustand** for state management
* Write reusable UI components

---

# 📝 Commit Message Guidelines

Use clear commit messages.

Examples:

```
feat: add AI itinerary optimization
fix: resolve authentication bug
docs: update README
refactor: improve transit service logic
test: add media API tests
```

---

# 🐛 Issues and Feature Requests

Check open issues first:

```
https://github.com/ImGJUser1/Journii/issues
```

Create an issue if:

* reporting a bug
* suggesting a feature
* proposing improvements
* requesting documentation updates

Provide:

* clear description
* reproduction steps
* screenshots if applicable

---

# 🔐 Security Contributions

If you discover a **security vulnerability**, please **do not open a public issue**.

Instead contact maintainers privately through GitHub.

---

# 🧭 Areas Where Contributions Are Most Welcome

We especially welcome contributions in:

* AI itinerary generation improvements
* map route optimization
* recommendation algorithms
* social travel feed features
* real-time messaging performance
* UI/UX enhancements
* accessibility improvements
* mobile performance optimization

---

# 📜 Code of Conduct

We are committed to maintaining a **welcoming and inclusive community**.

Please:

* Be respectful
* Provide constructive feedback
* Help others learn

---

# 🙌 Thank You

Your contributions help make **Journii** a powerful platform for travelers worldwide.

Together we can build the future of **AI-powered travel discovery and planning**.

**Explore Culture • Plan Smart • Travel Together**
