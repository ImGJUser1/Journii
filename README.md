# 🌍 Journii – AI-Driven Cultural Journey Navigator & Commuter Companion

**Journii** is your **AI-powered cultural journey navigator** and **safe commuter companion**.
It seamlessly blends travel, culture, social connection, and mobility — helping users explore authentic experiences, plan smooth commutes, and engage with a global community.

---

## ✨ Key Features

* **🎭 Cultural Explorer** – Personalized recommendations for local events, artisan workshops, hidden gems, and food trails.
* **🚌 Smart Transit Planner** – Real-time transit guidance with filters for **eco-friendly**, **fastest**, or **scenic** routes.
* **🤝 Social Companion** – Match with like-minded travelers or locals to share journeys.
* **📅 Dynamic Itinerary Builder** – Auto-generated, customizable itineraries with live updates.
* **🌐 Community Sharing** – A space to share stories, itineraries, and cultural insights.
* **🏆 Gamified Rewards** – XP, points, and cultural achievement badges.
* **🔒 Secure Access** – JWT-based authentication for safe login and data handling.

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
├── tree.txt
```

---

## 💰 Monetization Roadmap

* **Dealsbe listing** for exclusive discounts & travel perks
* **Premium add-ons**:

  * Advanced AI-powered cultural recommendations
  * Real-time advanced transit analytics
  * Trust-verified companion matching

---

## 🤝 Contributing

We love contributions!

* Follow [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
* Submit feature requests, bug reports, or PRs.

---

## ❤️ Support the Project

If you find Journii valuable, support us via **GitHub Sponsors** 🙌.
Your help powers ongoing development and global cultural exchange.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).

---

## 📬 Contact

For inquiries, issues, or collaborations, reach out via GitHub Issues or email:
📧 **[your-email@example.com](mailto:your-email@example.com)**
