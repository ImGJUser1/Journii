Journii
Journii is an AI-driven cultural journey navigator and commuter companion app offering personalized experience recommendations, real-time transit routing, social travel matching, safety alerts, dynamic itineraries, community storytelling, and gamified rewards. Explore culture and commute safely with AI-powered guidance.
Features

Cultural Explorer: AI-driven recommendations for cultural events, artisan workshops, and food tours.
Transit Planner: Real-time transit routing with preferences for eco-friendly or scenic routes.
Social Companion: Match with like-minded travelers for shared experiences.
Itinerary Builder: Dynamic, customizable travel itineraries.
Community Sharing: Share travel stories and tips with a global community.
Gamification: Earn points and badges for completing travel activities.
Authentication: Secure user login with JWT-based authentication.

Tech Stack

Backend: FastAPI, Python 3.10+, SQLAlchemy, SQLite/PostgreSQL, Gemini API
Frontend: React Native, Expo, TypeScript, NativeWind, React Query, Zustand
Tools: Git, GitHub Actions, Jest, Pytest

Getting Started
Prerequisites

Backend:
Python 3.10+
pip, virtualenv
PostgreSQL (or SQLite for development)


Frontend:
Node.js 18+
npm 8+
Expo Go (for mobile testing)


Git and a GitHub account

Installation

Clone the Repository:
git clone https://github.com/ImGJUser1/Journii.git
cd Journii


Backend Setup:
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Windows
pip install -r app/requirements.txt


Create backend/app/.env:DATABASE_URL=sqlite:///journii.db
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secure_secret


Run the backend:python -m uvicorn app.main:app --reload

Access at http://localhost:8000/docs.


Frontend Setup:
cd frontend
npm install
npm start


Scan the QR code with Expo Go or run on an emulator.
Ensure API_URL=http://localhost:8000 in frontend components.



Project Structure
Journii/
├── .github/
│   ├── workflows/
│   │   ├── dependency-scan.yml
│   ├── FUNDING.yml
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── requirements.txt
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── models/
│   │   ├── tests/
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── cultural.tsx
│   │   │   ├── rewards.tsx
│   │   │   ├── social.tsx
│   │   │   ├── transit.tsx
│   │   ├── stores/
│   │   │   ├── app-store.ts
│   ├── package.json
├── CONTRIBUTING.md
├── .gitignore
├── README.md

Contributing
We welcome contributions! Please read CONTRIBUTING.md for guidelines on how to contribute, including coding standards and pull request processes.
Support the Project
Love Journii? Support us via GitHub Sponsors to help maintain and improve the app!
License
MIT License. See LICENSE for details.
Contact
For questions, open an issue on GitHub or contact the maintainers at [your-email@example.com]..
