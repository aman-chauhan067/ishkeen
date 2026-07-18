# Ishkeen

![Ishkeen Hero](https://via.placeholder.com/1200x400/253A4A/FCFBF8?text=Ishkeen+-+Clinical+Skincare+Intelligence)

Ishkeen is a professional AI-assisted skincare analysis and recommendation platform. It leverages a proprietary clinical inference engine and computer vision ML models to analyze user selfies for acne breakouts, mapping the visual data to a deterministic evidence graph to recommend personalized skincare routines.

Designed to mimic a premium dermatologist consultation, the application features an elegant, editorial-style user interface built with modern web technologies.

## ✨ Features

- **Clinical Skin Analysis:** Upload selfies for automated ML inference identifying acne lesions, hyperpigmentation, and severity.
- **Evidence-Based Recommendations:** Generates robust, explainable skincare routines (Morning/Night) via a deterministic clinical evidence graph.
- **Privacy-First Architecture:** Employs secure HttpOnly cookies, session management, and granular user profile boundaries.
- **Admin & Telemetry Portal:** A comprehensive back-office dashboard providing full traceability of model inferences, user cohorts, and real-time system logs.
- **Editorial Design System:** A highly polished, aesthetic frontend utilizing typography, glassmorphism, and ambient micro-animations.

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router
- **Backend:** FastAPI, Python 3.11, SQLAlchemy 2.x, Pydantic
- **Machine Learning:** PyTorch, Torchvision, ONNX Runtime
- **Database:** PostgreSQL 15, Alembic Migrations
- **Authentication:** Google OAuth 2.0, Secure Session Cookies
- **Infrastructure:** Docker, Docker Compose

## 🏗 Architecture

Ishkeen follows a decoupled Client-Server architecture:
1. **Presentation Layer (SPA):** A React application that communicates with the backend exclusively via RESTful JSON APIs.
2. **Application Layer (API):** A FastAPI service managing business logic, routing, auth middleware, and orchestrating ML tasks.
3. **Data Layer (PostgreSQL):** Relational storage for User Profiles, Auth Sessions, ML Analysis History, and System Logs.
4. **Inference Layer:** An embedded Python ML execution context running local PyTorch models.

## 📁 Folder Structure

```
ishkeen/
├── backend/                  # FastAPI Application
│   ├── app/                  # Application Source
│   │   ├── api/              # Route Controllers
│   │   ├── core/             # Auth, Security, Config
│   │   ├── models/           # SQLAlchemy Entities
│   │   ├── schemas/          # Pydantic DTOs
│   │   └── services/         # Business Logic & ML
│   ├── alembic/              # Database Migrations
│   └── tests/                # Pytest Suite
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI & Animations
│   │   ├── pages/            # View Controllers
│   │   ├── auth/             # Context Providers
│   │   └── lib/              # API Client
├── ml/                       # Model Training & Scripts
└── docker-compose.yml        # Orchestration
```

## 🚀 Installation & Run Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL (v15+) or Docker

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ishkeen.git
cd ishkeen
```

### 2. Environment Variables
Copy the provided `.env.example` to `.env` in the root directory and populate it with your credentials:
```bash
cp .env.example .env
```
*(Ensure you provide a valid PostgreSQL connection string and Google OAuth credentials if using authentication).*

### 3. Start the Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head       # Run database migrations
uvicorn app.main:app --reload
```

### 4. Start the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🐳 Docker

To run the entire stack using Docker Compose:

```bash
docker-compose up --build
```
This provisions the Database, API, and Frontend containers automatically.

## 📸 Screenshots

*(Replace placeholders with actual application screenshots)*

| Landing Page | Results Dashboard |
|:---:|:---:|
| ![Landing](https://via.placeholder.com/600x400/F7F7F5/253A4A?text=Landing+Page) | ![Dashboard](https://via.placeholder.com/600x400/F7F7F5/253A4A?text=Analysis+Results) |

| Admin Telemetry | User Profile |
|:---:|:---:|
| ![Admin](https://via.placeholder.com/600x400/F7F7F5/253A4A?text=Admin+Dashboard) | ![Profile](https://via.placeholder.com/600x400/F7F7F5/253A4A?text=User+Settings) |

## 🗺 Future Roadmap

- [ ] iOS and Android Native Applications via React Native
- [ ] Integration with advanced hyperspectral imaging models
- [ ] E-Commerce integration for direct product fulfillment
- [ ] Expanded multi-language localization
- [ ] Dermatologist Telehealth portal for manual overrides

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
