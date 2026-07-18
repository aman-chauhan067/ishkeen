import uuid
import time
import traceback
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.database import SessionLocal
from app.models.system import SystemSetting, SystemLog
from sqlalchemy.exc import SQLAlchemyError

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        start_time = time.time()
        
        db = SessionLocal()
        exception_msg = None
        status_code = 500
        response = None
        
        try:
            # Check Maintenance Mode
            if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/admin") and not request.url.path.startswith("/api/auth"):
                setting = db.query(SystemSetting).filter_by(id="global").first()
                if setting and setting.maintenance_mode:
                    status_code = 503
                    return JSONResponse(status_code=503, content={"detail": "System is currently under maintenance."})
            
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            exception_msg = traceback.format_exc()
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "request_id": request_id}
            )
        finally:
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log the request
            if request.url.path.startswith("/api/"):
                try:
                    level = "ERROR" if status_code >= 400 else "INFO"
                    if exception_msg: level = "ERROR"
                    
                    log = SystemLog(
                        level=level,
                        ip_address=request.client.host if request.client else None,
                        endpoint=request.url.path,
                        method=request.method,
                        status_code=status_code,
                        duration_ms=duration_ms,
                        user_agent=request.headers.get("user-agent"),
                        message=f"{request.method} {request.url.path}",
                        exception=exception_msg
                    )
                    db.add(log)
                    db.commit()
                except Exception as e:
                    pass # Don't break the response if logging fails
            db.close()
            
        # Secure Headers
        if response:
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(duration_ms)
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        return response
