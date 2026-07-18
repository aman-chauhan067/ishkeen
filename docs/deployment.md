# Deployment Guide

Ishkeen is designed to be easily deployable using Docker.

## 1. Docker Compose (Recommended)

The easiest way to run the entire stack (Database, Backend, Frontend) in production is via `docker-compose`.

```bash
# Clone the repository
git clone https://github.com/ishkeen/ishkeen.git
cd ishkeen

# Create your production environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit the environment variables as necessary
# nano backend/.env

# Build and launch the stack in detached mode
docker-compose up -d --build
```

The application will now be running. The frontend is exposed on port 80, and the backend is exposed on port 8000.

## 2. Production Deployment (Cloud)

For AWS/GCP/Azure deployments:

1. **Database:** Use a managed PostgreSQL instance (e.g. AWS RDS) instead of the Dockerized database. Update the `POSTGRES_SERVER`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` environment variables to point to your managed instance.
2. **Backend:** Deploy the backend Docker container (`backend/Dockerfile`) to a service like AWS ECS, Google Cloud Run, or a Kubernetes cluster.
3. **Frontend:** While the frontend can run via Docker (Nginx), for highest performance, build the static assets (`npm run build`) and host them on a CDN (e.g. AWS CloudFront + S3, Vercel, Netlify).

## 3. HTTPS & Reverse Proxy

For production, you MUST use HTTPS. 
If running via Docker Compose on a single VPS (e.g. DigitalOcean Droplet), place an Nginx or Caddy reverse proxy *in front* of the Docker Compose stack to handle SSL termination (e.g. via Let's Encrypt).

Example Caddy configuration:
```
ishkeen.yourdomain.com {
    reverse_proxy localhost:80
}

api.ishkeen.yourdomain.com {
    reverse_proxy localhost:8000
}
```

## 4. Database Migrations

When pulling new code that contains database schema changes, you must run Alembic migrations against the production database:

```bash
docker exec -it ishkeen-backend alembic upgrade head
```

## 5. Backup Strategy

Automated backups are critical. 
- If using a managed database (RDS), enable automated daily snapshots.
- If using the Dockerized PostgreSQL instance, implement a daily cron job that runs `pg_dump` and uploads the SQL file to AWS S3.

**Uploads Backup:**
User uploaded images are stored locally in `backend/private_uploads`. You must back up this Docker volume regularly.

## 6. CI/CD (GitHub Actions)

Ishkeen includes a pre-configured `.github/workflows/ci.yml` that automatically runs on every push to `main` and every Pull Request.
It enforces:
- Backend `flake8` linting and `mypy` typechecking.
- Backend `pytest` suite.
- ML `pytest` suite.
- Frontend `tsc` typechecking.
- Frontend Vite production builds.
