import pytest
from app.core.config import settings
from app.main import app
from app.api.deps import verify_csrf_origin

@pytest.fixture(autouse=True)
def override_settings():
    # Never send real emails during tests
    settings.EMAIL_PROVIDER = "console"
    from app.services.email_service import email_service, ConsoleEmailProvider
    email_service.provider = ConsoleEmailProvider()
    
    # Override CSRF check for tests
    app.dependency_overrides[verify_csrf_origin] = lambda: None
    
    yield
    app.dependency_overrides.clear()
