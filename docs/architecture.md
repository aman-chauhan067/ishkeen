# Ishkeen Architecture

Ishkeen is built as a modular monolith designed for a clean separation of concerns, ensuring maintainability and an easy path to extract microservices if the need arises.

## 1. Frontend Architecture

- **Framework**: React with TypeScript.
- **Build Tool**: Vite for fast HMR and optimized production builds.
- **Styling**: Tailwind CSS for utility-first styling.
- **Routing**: React Router for Single Page Application navigation.
- **State Management**: React state hooks.
- **API Interaction**: Native `fetch` wrapper calling the FastAPI backend.

## 2. Backend Architecture

The backend is built with FastAPI and organized into distinct logical boundaries:

- **API (`app/api`)**: FastAPI routers handling HTTP requests, response models, and API security.
- **Core (`app/core`)**: Application configuration, database connections, and middleware (e.g. `RequestContextMiddleware`).
- **Models (`app/models`)**: SQLAlchemy 2.0 ORM definitions defining the PostgreSQL database schema.
- **Schemas (`app/schemas`)**: Pydantic models for data validation and serialization.
- **Services (`app/services`)**: Core business logic and orchestrations, completely decoupled from HTTP concerns.

## 3. Machine Learning Architecture

The ML pipeline is isolated in the `ml/` directory, operating completely independently of the backend API, sharing only final exported ONNX models.

- **Framework**: PyTorch.
- **Models**: Convolutional Neural Networks (ResNet-18 / ResNet-34) optimized for binary classification (acne presence).
- **Inference Integration**: The backend `InferenceService` utilizes `onnxruntime` to execute the pre-trained weights safely in a CPU or GPU environment.

### Dataset Pipeline
Handles ingestion, cleaning, splitting, and augmentation of raw image datasets. It safely standardizes images, strips invalid EXIF data, and constructs PyTorch `DataLoader` objects.

### Training Pipeline
An orchestrator (`Trainer`) that manages the training loop, learning rate schedulers, mixed-precision training via AMP, early stopping, and automatic checkpointing based on validation AUROC.

## 4. Recommendation Engine & Evidence Graph

The recommendation system does not use generative AI. Instead, it uses a highly deterministic, interpretable **Evidence Graph**.

- **Evidence Extraction**: Data from user profiles (questionnaires) and ML inference results are injected into the graph as raw `Evidence`.
- **Policy Engine**: A strict rules engine that processes Evidence to determine skin conditions and sensitivities.
- **Product Filtering**: Ingredients known to aggravate identified conditions (e.g., salicylic acid for extremely dry skin) are aggressively filtered.
- **Traceability**: Every decision the graph makes emits a telemetry event. These events are compiled into a `RecommendationTrace`, guaranteeing 100% explainability for why a specific product was recommended or blocked.

## 5. Deployment Architecture

- **Containerization**: Both backend and frontend are Dockerized using multi-stage builds to minimize image sizes.
- **Orchestration**: `docker-compose` binds the Backend, Frontend, and PostgreSQL instances together, ensuring safe boot ordering via health checks.
- **CI/CD**: GitHub Actions enforces linting, static typechecking, and rigorous unit testing on every commit.

For detailed deployment instructions, see [deployment.md](deployment.md).
