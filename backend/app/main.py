from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import RequestContextMiddleware
from app.api.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.profile import router as profile_router
from app.api.routes.analyses import router as analyses_router
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.admin import router as admin_router
from app.api.routes.dev import router as dev_router
from app.services.inference_service import InferenceService
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """
    Application lifespan manager.
    Loads the ONNX inference session once at startup, stores in app.state.
    """
    app_instance.state.inference_service = InferenceService()
    
    # Ensure database tables exist
    try:
        import app.models.user
        import app.models.profile
        import app.models.analysis
        import app.models.recommendation
        import app.models.notification
        import app.models.token
        import app.models.system
        Base.metadata.create_all(bind=engine)
        print("Database tables created/verified successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

    # Auto-seed development admin
    admin_email = settings.ADMIN_EMAIL or "admin@example.com"
    admin_password = settings.ADMIN_PASSWORD or "AdminPassword123!"
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == UserRole.admin).first()
        if not admin_exists:
            dev_admin = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                role=UserRole.admin,
                is_email_verified=True,
                auth_provider="local"
            )
            db.add(dev_admin)
            db.commit()
            print(f"Seeded development admin: {admin_email}")
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()
            
    yield
    # Cleanup (onnxruntime sessions are released by GC)
    app_instance.state.inference_service = None


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"/openapi.json",
    lifespan=lifespan
)

from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.pages\.dev|https://.*\.workers\.dev|http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestContextMiddleware)

app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(profile_router, prefix="/api", tags=["profile"])
app.include_router(analyses_router, prefix="/api", tags=["analyses"])
app.include_router(recommendations_router, prefix="/api", tags=["recommendations"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(dev_router, prefix="/api/v1", tags=["dev"])

from fastapi.staticfiles import StaticFiles
import os

if not os.path.exists("uploads/avatars"):
    os.makedirs("uploads/avatars")
    
app.mount("/api/users/avatars", StaticFiles(directory="uploads/avatars"), name="avatars")

@app.get("/")
def root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API"}
