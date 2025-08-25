Contributing to Journii
Thank you for your interest in contributing to Journii, a Cultural Journey Navigator and Social Commuter Companion! This project combines a FastAPI backend with a React Native (Expo) frontend to provide personalized travel recommendations, transit planning, and social engagement. We welcome contributions from the community to enhance features, fix bugs, or improve documentation.
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

Project Structure
Journii/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── models/
│   │   ├── config.py
│   │   ├── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   ├── stores/
│   ├── package.json
├── README.md
├── CONTRIBUTING.md

Setting Up the Development Environment

Clone the Repository:
git clone https://github.com/<your-username>/journii.git
cd journii


Backend Setup:
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Windows
pip install -r app/requirements.txt
python -m uvicorn app.main:app --reload


Ensure .env is configured with DATABASE_URL, GEMINI_API_KEY, etc.
Backend runs at http://localhost:8000.


Frontend Setup:
cd frontend
npm install
npm start


Use Expo Go to scan the QR code or run on an emulator.



How to Contribute

Fork the Repository:

Fork the project on GitHub: https://github.com/<your-username>/journii.
Clone your fork: git clone https://github.com/<your-username>/journii.git.


Create a Feature Branch:
git checkout -b feature/your-feature-name


Make Changes:

Follow coding standards (PEP 8 for Python, ESLint for TypeScript).
Update backend routers (app/routers/) or frontend components (app/(tabs)/).
Add tests in backend/app/tests/ or frontend/__tests__/.


Commit Changes:
git add .
git commit -m "Add feature: your-feature-name"


Push to Your Fork:
git push origin feature/your-feature-name


Create a Pull Request:

Go to the original repository: https://github.com/<your-username>/journii.
Click "New Pull Request" and select your branch.
Provide a clear description of your changes and link to any related issues.



Coding Standards

Backend (Python/FastAPI):
Follow PEP 8.
Use Pydantic models for request/response validation.
Handle errors with app/utils/error_handling.py.


Frontend (React Native/Expo):
Use TypeScript with ESLint (expo lint).
Follow NativeWind (Tailwind CSS) for styling.
Use React Query for API calls and Zustand for state management.


Write clear commit messages (e.g., Fix: Update cultural explorer API endpoint).

Testing

Backend: Add tests in app/tests/ using pytest.cd backend
pytest app/tests/


Frontend: Add tests in __tests__/ using Jest.cd frontend
npm test



Issues and Feature Requests

Check the GitHub Issues page for open tasks.
Create a new issue for bugs or feature suggestions, providing detailed information.

Code of Conduct
We follow a Code of Conduct to ensure a welcoming environment. Please adhere to it in all interactions.
Questions?
Contact the maintainers via GitHub Issues or email (add contact email if applicable).
Thank you for contributing to Journii!