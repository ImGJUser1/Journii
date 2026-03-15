<<<<<<< HEAD
Journii
=======

>>>>>>> b65092d1915003b0aff48b08fca9d6b47e255fd6
Journii is an AI-driven cultural journey navigator and commuter companion app offering personalized experience recommendations, real-time transit routing, social travel matching, safety alerts, dynamic itineraries, community storytelling, and gamified rewards. Explore culture and commute safely with AI-powered guidance.
Features

Cultural Explorer: AI-driven recommendations for cultural events, artisan workshops, and food tours.
Transit Planner: Real-time transit routing with preferences for eco-friendly or scenic routes.
Social Companion: Match with like-minded travelers for shared experiences.
Itinerary Builder: Dynamic, customizable travel itineraries.
Community Sharing: Share travel stories and tips with a global community.
Gamification: Earn points and badges for completing travel activities.
Authentication: Secure user login with JWT-based authentication.

---

## 🛠 Tech Stack

**Backend**

* FastAPI (Python 3.10+)
* SQLAlchemy ORM
* SQLite / PostgreSQL
* Gemini AI API integration

**Frontend**

* React Native (Expo)
* TypeScript
* NativeWind (Tailwind for RN)
* Zustand (state management)
* React Query (data fetching & caching)

**DevOps & Tools**

* Git + GitHub Actions (CI/CD)
* Jest (frontend tests)
* Pytest (backend tests)

---

## 🚀 Getting Started

### ✅ Prerequisites

* **Backend**: Python 3.10+, pip, virtualenv, PostgreSQL (or SQLite for local dev)
* **Frontend**: Node.js 18+, npm 8+, Expo Go app
* Git + GitHub account

---

### 🔧 Installation

#### 1. Clone Repository

```bash
git clone https://github.com/ImGJUser1/Journii.git
cd Journii
```

#### 2. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r app/requirements.txt
```

Create `.env` in **`backend/app`**:

```env
DATABASE_URL=sqlite:///journii.db
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secure_secret
```

Run backend:

```bash
python -m uvicorn app.main:app --reload
```

➡ Visit API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

#### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

* Scan QR with **Expo Go** or run in emulator.
* Ensure frontend config has correct API endpoint:

```ts
API_URL=http://localhost:8000
```

---

## 📂 Project Structure

```
Journii/
├── .github/                # CI/CD, dependabot, funding configs
│   ├── workflows/
│   │   ├── dependency-scan.yml
│   ├── dependabot.yml
│   ├── FUNDING.yml
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── requirements.txt
│   │   ├── routers/         # API endpoints
│   │   │   ├── cultural_explorer.py
│   │   │   ├── gamification.py
│   │   │   ├── auth.py
│   │   │   ├── transit_planner.py
│   │   │   ├── social_companion.py
│   │   │   ├── itinerary_builder.py
│   │   │   ├── community_sharing.py
│   │   ├── schemas/         # Pydantic models
│   │   ├── services/        # AI, external APIs
│   │   ├── utils/           # Helpers & JWT
│   │   ├── models/          # SQLAlchemy models
│   │   ├── tests/           # Backend unit tests
│   │   ├── .env
├── frontend/
│   ├── app/
│   │   ├── (tabs)/          # Expo Router navigation
│   │   │   ├── _layout.tsx
│   │   │   ├── cultural.tsx
│   │   │   ├── rewards.tsx
│   │   │   ├── social.tsx
│   │   │   ├── transit.tsx
│   │   ├── stores/
│   │   │   ├── app-store.ts
│   ├── package.json
│   ├── tsconfig.json
├── CONTRIBUTING.md
├── LICENSE
├── README.md

Contributing
We welcome contributions! Please read CONTRIBUTING.md for guidelines on how to contribute, including coding standards and pull request processes.
Support the Project
Love Journii? Support us via GitHub Sponsors to help maintain and improve the app!
License
MIT License. See LICENSE for details.
Contact
<<<<<<< HEAD
For questions, open an issue on GitHub or contact the maintainers at [your-email@example.com].
=======
For questions, open an issue on GitHub or contact the maintainers at [your-email@example.com]..
>>>>>>> b65092d1915003b0aff48b08fca9d6b47e255fd6
