# 1. Setup environment
cd backend
cp .env.example .env
# Edit .env with your API keys

# 2. Start infrastructure
docker-compose up -d db redis minio

# 3. Run migrations
alembic upgrade head

# 4. Start API
uvicorn app.main:app --reload

# 5. Or use Docker
docker-compose up api