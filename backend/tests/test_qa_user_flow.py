import pytest
from unittest.mock import patch, PropertyMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Mock config BEFORE importing app
patcher1 = patch('app.core.config.Settings.SQLALCHEMY_DATABASE_URI', new_callable=PropertyMock, return_value='sqlite:///./qa.db')
patcher1.start()

# 2. Mock create_engine to strip psycopg args
original_create_engine = create_engine
def mock_create_engine(url, **kwargs):
    kwargs.pop("connect_args", None)
    return original_create_engine(url, **kwargs)

patcher2 = patch('app.core.database.create_engine', side_effect=mock_create_engine)
patcher2.start()

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

# Ensure clean DB
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def test_full_user_flow():
    with TestClient(app) as client:
        # 1. Create fresh account
        email = "qa@example.com"
        password = "SecurePassword123!"
        
        resp = client.post("/api/auth/signup", json={"email": email, "password": password})
        assert resp.status_code == 201, f"Signup failed: {resp.text}"
        print("OK Registration successful")
        
        # 2. Login
        resp = client.post("/api/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        token = resp.cookies.get("ishkeen_session")
        assert token, "Session cookie not set"
        client.cookies.set("ishkeen_session", token)
        print("OK Login successful")
        
        # 3. Complete onboarding (questionnaire)
        profile_data = {
            "skin_type": "combination",
            "current_concerns": ["breakouts", "clogged_pores"],
            "primary_goal": "fewer_visible_breakouts",
            "sensitivity_tendency": "low",
            "routine_product_categories": ["cleanser", "moisturizer"],
            "active_ingredient_categories": ["none"],
            "sunscreen_frequency": "daily",
            "routine_experience": "familiar",
            "clinician_directed_treatment": False,
            "known_reaction_categories": ["fragrance"],
            "preference_avoid_categories": [],
            "climate": "temperate"
        }
        resp = client.post("/api/questionnaires/submissions", json=profile_data)
        assert resp.status_code == 201, f"Questionnaire failed: {resp.text}"
        print("OK Onboarding successful")
        
        # 4. Upload test image
        import io
        from PIL import Image
        img = Image.new("RGB", (600, 600), color="white")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        
        resp = client.post(
            "/api/analyses", 
            files={"file": ("test.jpg", img_bytes, "image/jpeg")}
        )
        assert resp.status_code == 201, f"Upload failed: {resp.text}"
        analysis_id = resp.json()["id"]
        print("OK Image upload and inference successful")
        
        # 5. Generate recommendations
        resp = client.post(
            "/api/recommendations/generate"
        )
        assert resp.status_code == 200 or resp.status_code == 201, f"Recommendation generation failed: {resp.text}"
        print("OK Recommendations generated")
        
        # 6. Open history (List recommendations)
        resp = client.get("/api/recommendations/latest")
        assert resp.status_code == 200, f"List recommendations failed: {resp.text}"
        assert resp.json() is not None
        print("OK Recommendation history retrieved")
        
        # 7. Logout
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200, f"Logout failed: {resp.text}"
        client.cookies.clear()
        print("OK Logout successful")
        
        # 8. Login again
        resp = client.post("/api/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, f"Second login failed: {resp.text}"
        token = resp.cookies.get("ishkeen_session")
        client.cookies.set("ishkeen_session", token)
        print("OK Second login successful")
        
        # 9. Verify history persists
        resp = client.get("/api/recommendations/latest")
        assert resp.status_code == 200, f"Second history fetch failed: {resp.text}"
        assert resp.json() is not None
        print("OK History persisted across sessions")
