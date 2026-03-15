# 🌍 Journii

**Journii** is an AI-powered cultural journey navigator, travel social platform, and intelligent trip planning marketplace designed to help people **discover destinations, plan trips, connect with travelers, and book experiences worldwide**.

Journii combines **AI trip planning, cultural discovery, social travel networking, mobility guidance, and travel marketplace services** into one unified platform.

Users can explore destinations through **community travel stories, reels, and location-based content**, build **AI-generated itineraries**, collaborate with friends on trips, and seamlessly book **hotels, experiences, and transportation**.

---

# ✨ Platform Vision

Journii aims to unify four major travel experiences:

* **Travel Discovery** – Explore destinations through social posts, travel reels, and community recommendations
* **AI Trip Planning** – Generate dynamic itineraries tailored to interests, budget, and time
* **Travel Social Network** – Connect with travelers, share stories, and collaborate on trips
* **Global Travel Marketplace** – Discover and book hotels, experiences, tours, and local services

The platform enables a seamless journey from **inspiration → planning → booking → sharing experiences**.

---

# 🚀 Core Features

## 🧭 Cultural Explorer

AI-powered recommendations for authentic cultural experiences.

Discover:

* Local festivals
* Artisan workshops
* Food trails
* Cultural heritage sites
* Hidden gems

Recommendations adapt to user interests such as **history, food, art, photography, or adventure**.

---

## 🚆 Smart Transit Planner

Real-time transit planning for efficient city navigation.

Features include:

* Fastest routes
* Scenic travel routes
* Eco-friendly transit options
* Public transportation guidance
* Real-time route optimization

The planner integrates **multi-modal travel options** such as buses, metro, rideshare, and walking paths.

---

## 🤝 Social Companion

Connect with like-minded travelers and locals.

Capabilities include:

* Travel companion matching
* Shared experiences
* Local guides and meetups
* Travel community interactions

This allows solo travelers to **discover safe and social travel opportunities**.

---

## 🗺 Dynamic AI Itinerary Builder

Journii automatically generates travel itineraries based on:

* Destination
* Budget
* Interests
* Trip duration
* Travel preferences

Users can:

* Customize itineraries
* Rearrange destinations
* Add new locations
* Optimize routes automatically

---

## 🧠 AI Map Trip Builder

An interactive map-based trip planner that allows users to visually design journeys.

Users can:

* Add locations to a map
* Drag-and-drop route stops
* Optimize travel paths
* Calculate travel time and distance
* Discover nearby attractions

---

## 👥 Collaborative Trip Planning

Plan trips together with friends.

Group features include:

* Shared itineraries
* Group voting on destinations
* Real-time trip edits
* Group messaging
* Expense sharing

---

## 📸 Travel Social Platform

Journii includes a **location-based social media system**.

Users can post:

* Travel photos
* Short videos and reels
* Travel blogs and tips
* Audio travel stories

Posts are tagged with **geographic locations**, enabling destination discovery through community content.

---

## 📍 Location-Based Discovery Feed

When users search for a destination, Journii displays:

* Trending travel videos
* Popular community posts
* Highly rated attractions
* AI-recommended destinations

This creates an immersive **map-driven discovery experience**.

---

## 🏨 Travel Business Marketplace

Businesses can list services on the platform.

Supported listings include:

* Hotels and accommodations
* Tour operators
* Adventure activities
* Restaurants and cafes
* Local guides
* Transportation providers

Businesses manage listings through a **dashboard with analytics and booking management**.

---

## 💳 Booking & Commission Model

Users can book travel services directly through Journii.

Supported bookings:

* Hotels
* Experiences
* Local tours
* Transportation
* Activities

Journii operates on a **commission-based marketplace model** for each successful booking.

---

## 🌐 International Travel Support

Journii helps users plan global trips by providing:

* Visa requirements
* Application timelines
* Required documentation
* Entry rules and procedures

This simplifies international travel planning.

---

## 🏆 Gamification System

Users earn rewards for exploration and engagement.

Gamification includes:

* Travel XP points
* Achievement badges
* Cultural exploration milestones
* Community recognition

This encourages users to **discover new destinations and contribute content**.

---

## 🔐 Secure Authentication

Journii uses secure authentication mechanisms including:

* JWT-based authentication
* Protected APIs
* Secure session management
* Role-based access for users and businesses

---

# 🛠 Technology Stack

## Backend

* **Python 3.10+**
* **FastAPI** – High-performance async API framework
* **SQLAlchemy** – ORM for database models
* **SQLite / PostgreSQL** – Data storage
* **Gemini AI API** – AI-powered travel recommendations
* **Pydantic** – Data validation and schema management

---

## Frontend

* **React Native (Expo)**
* **TypeScript**
* **NativeWind** – Tailwind CSS for React Native
* **Zustand** – Lightweight state management
* **React Query** – Data fetching and caching

---

## DevOps & Tooling

* **Git & GitHub**
* **GitHub Actions** – Continuous Integration
* **Jest** – Frontend testing
* **Pytest** – Backend testing

---

# 📦 Getting Started

## Prerequisites

Backend:

* Python 3.10+
* pip
* virtualenv
* PostgreSQL (or SQLite for development)

Frontend:

* Node.js 18+
* npm 8+
* Expo Go mobile app

---

# 🔧 Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/ImGJUser1/Journii.git
cd Journii
```

---

## 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
```

Activate environment:

Windows:

```bash
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r app/requirements.txt
```

Create `.env` file inside **backend/app**:

```env
DATABASE_URL=sqlite:///journii.db
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secure_secret
```

Run backend server:

```bash
python -m uvicorn app.main:app --reload
```

Backend API documentation:

```
http://localhost:8000/docs
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

Run using:

* Expo Go (scan QR code)
* Android Emulator
* iOS Simulator

Ensure API configuration points to backend:

```ts
API_URL=http://localhost:8000
```

---

# 📂 Project Structure

```
Journii/
│
├── .github/
│   ├── workflows/
│   │   ├── dependency-scan.yml
│   ├── dependabot.yml
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routers/         # API endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # AI integrations & business logic
│   │   ├── utils/           # Authentication & helpers
│   │   ├── tests/           # Backend unit tests
│   │   ├── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (tabs)/          # Expo Router navigation
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand state management
│   │
│   ├── package.json
│   ├── tsconfig.json
│
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

# 🧪 Testing

Backend tests:

```bash
pytest
```

Frontend tests:

```bash
npm test
```

---

# 🤝 Contributing

Contributions are welcome!

Please read **CONTRIBUTING.md** for:

* coding standards
* pull request guidelines
* development workflow

---

# 💡 Future Roadmap

Planned features include:

* AI video travel guides
* Smart trip budget optimization
* Travel safety monitoring
* Real-time event discovery
* Creator monetization tools
* Travel influencer analytics
* Business booking dashboards

---

# 📜 License

This project is licensed under the **MIT License**.

See `LICENSE` for details.

---

# 📬 Contact

For questions, feature requests, or collaboration opportunities:

Open an issue on GitHub or contact the maintainers.

---

**Journii – Explore Culture. Plan Smart. Travel Together.**
