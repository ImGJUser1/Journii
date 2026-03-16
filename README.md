# 🌍 Journii (V2)

![Journii Platform Overview](frontend/assets/images/about.png)

**Journii** is an AI-powered cultural journey navigator, travel social platform, and intelligent trip planning marketplace designed to help people **discover destinations, plan trips, connect with travelers, and book experiences worldwide**.

Journii combines **AI trip planning, cultural discovery, social travel networking, mobility guidance, and travel marketplace services** into one unified platform.

Users can explore destinations through **community travel stories, reels, and location-based content**, build **AI-generated itineraries**, collaborate with friends on trips, and seamlessly book **hotels, experiences, and transportation**.

---

# ✨ Platform Vision

Journii unifies four major travel experiences into a single ecosystem:

* **Travel Discovery** – Explore destinations through reels, stories, and community recommendations
* **AI Trip Planning** – Generate dynamic itineraries based on interests, budget, and time
* **Travel Social Network** – Connect with travelers and collaborate on trips
* **Global Travel Marketplace** – Discover and book hotels, experiences, tours, and local services

The platform enables a seamless journey:

```
Inspiration → Planning → Collaboration → Booking → Travel → Sharing
```

---

# 🚀 Core Features

## 🧭 Cultural Explorer

AI-powered recommendations for **authentic cultural experiences** beyond typical tourist attractions.

Discover:

* Local festivals
* Artisan workshops
* Food trails
* Cultural heritage sites
* Hidden attractions

Recommendations adapt to user interests such as:

* History
* Food
* Photography
* Art
* Adventure

---

## 🚆 Smart Transit Planner

Real-time intelligent transit planning for city navigation.

Features:

* Fastest routes
* Scenic routes
* Eco-friendly travel options
* Public transportation guidance
* Route optimization
* Distance and travel time calculations

Supports **multi-modal transport systems** including:

* Metro
* Bus
* Walking
* Cycling
* Rideshare
* Taxi

---

## 🤝 Social Companion

Journii enables travelers to connect with others who share similar interests.

Capabilities include:

* Travel companion matching
* Shared trips
* Local meetup discovery
* Traveler communities
* Social interactions around destinations

Perfect for **solo travelers seeking social experiences**.

---

## 🗺 Dynamic AI Itinerary Builder

Journii generates **complete travel itineraries automatically**.

Inputs include:

* Destination
* Trip duration
* Budget
* Travel interests
* Preferences

Example:

```
3 Day Trip – Hampi

Day 1
Virupaksha Temple
Hampi Bazaar
Hemakuta Hill Sunset

Day 2
Vittala Temple
Stone Chariot
Tungabhadra River Ride

Day 3
Anegundi Village
Sunrise Viewpoint
Local Food Trail
```

Users can:

* Customize itineraries
* Add new locations
* Rearrange stops
* Optimize travel routes

---

## 🧠 AI Map Trip Builder

Interactive map-based journey planner.

Users can:

* Add destinations visually
* Drag and reorder stops
* Calculate travel distance
* Optimize travel paths
* Discover nearby attractions

This creates a **visual planning experience similar to map-based route design tools**.

---

## 👥 Collaborative Trip Planning

Plan trips together with friends.

Features include:

* Shared itineraries
* Location voting
* Trip group chat
* Real-time editing
* Expense sharing

Example:

```
Trip: Goa Vacation

Members
Rahul
Priya
Swaroop

Activity Feed
Rahul added Baga Beach
Priya added Sunset Cruise
Swaroop booked hotel
```

---

## 📸 Travel Social Platform

Journii includes a **location-driven travel social media system**.

Users can post:

* Photos
* Short travel videos
* Reels
* Travel blogs
* Audio travel stories

All content is **geo-tagged**, enabling discovery through location.

Example:

```
📍 Hampi

Top Posts
Sunset Reel – Hemakuta Hill
Temple Walk – Vittala Temple
Street Food Review
```

---

## 📍 Location-Based Discovery Feed

When users search a destination, Journii displays:

* Trending travel videos
* Popular community posts
* Highly rated attractions
* AI recommended places

This creates an immersive **map-driven exploration feed**.

---

## 🏨 Travel Business Marketplace

Journii enables businesses to list services on the platform.

Supported listings:

* Hotels & accommodations
* Tour operators
* Adventure activities
* Restaurants
* Local guides
* Transport services

Businesses manage listings through a **business dashboard** with analytics and booking management.

---

## 💳 Booking & Commission Model

Journii allows users to **book travel services directly inside the platform**.

Supported bookings:

* Hotels
* Experiences
* Local tours
* Transportation
* Activities

Revenue model:

```
Commission per successful booking
```

Similar to travel marketplaces like:

* Booking platforms
* Experience marketplaces
* Travel aggregators

---

## 🌐 International Travel Support

Journii simplifies global travel planning by providing:

* Visa requirements
* Processing timelines
* Required documentation
* Entry rules

Example:

```
Japan Tourist Visa

Processing Time
7–10 days

Documents
Passport
Bank Statement
Travel Itinerary
```

---

## 🏆 Gamification System

Journii rewards engagement and exploration.

Users earn:

* XP points
* Travel badges
* Exploration levels
* Cultural achievements

Example badges:

* Explorer Badge – Visit 10 cities
* Story Creator – Post 5 reels
* Culture Enthusiast – Attend 3 events

---

## 💬 Real-Time Messaging System

Built-in messaging system similar to chat apps.

Chat types:

* Private chat
* Trip group chat
* Community chat

Users can share:

* itineraries
* media
* travel plans
* live updates

---

## 🔐 Secure Authentication

Journii uses modern security practices:

* JWT authentication
* Secure session management
* Protected APIs
* Role-based access
* Encrypted credentials

---

# 🛠 Technology Stack

## Backend

* **Python 3.10+**
* **FastAPI**
* **SQLAlchemy**
* **PostgreSQL / SQLite**
* **Redis**
* **Pydantic**
* **Gemini AI API**

---

## Frontend

* **React Native (Expo)**
* **TypeScript**
* **NativeWind**
* **Zustand**
* **React Query**

---

## DevOps & Tooling

* Git & GitHub
* GitHub Actions CI
* Pytest
* Jest
* Docker
* Docker Compose

---

# 📦 Getting Started

## Prerequisites

Backend:

* Python 3.10+
* pip
* virtualenv
* PostgreSQL or SQLite

Frontend:

* Node.js 18+
* npm 8+
* Expo Go

---

# 🔧 Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/ImGJUser1/Journii.git
cd Journii
```

---

# 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
```

Activate environment:

### Windows

```bash
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r app/requirements.txt
```

Create `.env` file inside **backend/app**

```env
DATABASE_URL=sqlite:///journii.db
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secure_secret
```

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend API documentation:

```
http://localhost:8000/docs
```

---

# 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

Run using:

* Expo Go (scan QR)
* Android Emulator
* iOS Simulator

Ensure API URL is correct:

```
API_URL=http://localhost:8000
```

---

# 📂 Project Structure

```
Journii/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── websocket/
│   │   ├── tests/
│   │   └── main.py
│
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   ├── marketplace/
│   │   ├── chat/
│   │   ├── experience/
│   │   ├── itinerary/
│   │   └── navigation/
│   │
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   └── assets/images/
│
├── .github/
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

# 🗺 Example User Journey

```
User searches: Hampi
↓
Sees travel reels and posts
↓
Selects interesting places
↓
AI builds itinerary
↓
User customizes trip on map
↓
Invites friends
↓
Books hotel and experiences
↓
Travels and records journey
↓
Posts reels and stories
```

---

# 🔮 Future Roadmap

Upcoming enhancements:

* AI travel video guides
* Smart budget optimization
* Travel safety monitoring
* Real-time event discovery
* Creator monetization tools
* Travel influencer analytics
* Business booking dashboards
* AI itinerary auto-adjustments during travel

---

# 🤝 Contributing

Contributions are welcome!

Please read **CONTRIBUTING.md** for:

* coding guidelines
* development workflow
* pull request standards

---

# 📜 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for details.

---

# 📬 Contact

For collaboration, issues, or feature requests:

Open an issue on GitHub.

---

# 🌍 Journii

**Explore Culture • Plan Smart • Travel Together**
