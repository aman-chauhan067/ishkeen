from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from app.main import app
from app.core.database import get_db

client = TestClient(app)

class MockSessionSuccess:
    def execute(self, *args, **kwargs):
        pass

class MockSessionFailure:
    def execute(self, *args, **kwargs):
        raise OperationalError("Connection refused", None, None)

def test_liveness_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_readiness_endpoint_success():
    app.dependency_overrides[get_db] = lambda: MockSessionSuccess()
    response = client.get("/api/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
    app.dependency_overrides.clear()

def test_readiness_endpoint_failure():
    app.dependency_overrides[get_db] = lambda: MockSessionFailure()
    response = client.get("/api/ready")
    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}
    app.dependency_overrides.clear()
